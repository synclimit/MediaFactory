import os
import json
import hashlib
import re
from datetime import datetime
import shutil

PROMPT_REGISTRY_DIR = os.path.join(os.path.dirname(__file__), "prompts", "registry")
PROMPT_LAB_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompt_lab")
CACHE_DIR = os.path.join(PROMPT_LAB_DIR, "cache")
EXPERIMENTS_DIR = os.path.join(PROMPT_LAB_DIR, "experiments")

class PromptManager:
    def __init__(self):
        os.makedirs(CACHE_DIR, exist_ok=True)
        os.makedirs(EXPERIMENTS_DIR, exist_ok=True)
        
    def get_prompt_path(self, prompt_id, version="latest"):
        """Resolves e.g. youtube_metadata_music -> youtube/metadata/music/latest"""
        parts = prompt_id.split('_')
        rel_path = os.path.join(*parts)
        return os.path.join(PROMPT_REGISTRY_DIR, rel_path, version)

    def load_package(self, prompt_id, version="latest"):
        path = self.get_prompt_path(prompt_id, version)
        if not os.path.exists(path):
            raise ValueError(f"Prompt package not found: {prompt_id} version {version}")
            
        prompt_txt_path = os.path.join(path, "prompt.txt")
        manifest_path = os.path.join(path, "manifest.json")
        
        with open(prompt_txt_path, "r", encoding="utf-8") as f:
            prompt_content = f.read()
            
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest_content = f.read()
            manifest = json.loads(manifest_content)
            
        return prompt_content, manifest_content, manifest
        
    def generate_fingerprint(self, prompt_content, manifest_content):
        # Hash SHA256(prompt.txt * manifest.json)
        data = f"{prompt_content}*{manifest_content}".encode("utf-8")
        return hashlib.sha256(data).hexdigest()

    def get_cache_key(self, prompt_id, version, manifest_version, provider):
        return f"{prompt_id}_{version}_{manifest_version}_{provider}"
        
    def compile_prompt(self, prompt_id, version, variables, provider="gemini"):
        prompt_content, manifest_content, manifest = self.load_package(prompt_id, version)
        
        fingerprint = self.generate_fingerprint(prompt_content, manifest_content)
        manifest_version = manifest.get("version", "1.0.0")
        
        cache_key = self.get_cache_key(prompt_id, version, manifest_version, provider)
        cache_file = os.path.join(CACHE_DIR, f"{cache_key}.json")
        
        compiled_text = prompt_content
        for key, value in variables.items():
            compiled_text = compiled_text.replace(f"{{{key}}}", str(value))
            
        result = {
            "prompt_hash": fingerprint,
            "compiled_prompt": compiled_text,
            "cache_key": cache_key,
            "manifest": manifest
        }
        
        # Save to cache
        with open(cache_file, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=4)
            
        return result

    def get_next_experiment_dir(self, prompt_id):
        date_str = datetime.now().strftime("%Y-%m-%d")
        base_dir = os.path.join(EXPERIMENTS_DIR, date_str)
        os.makedirs(base_dir, exist_ok=True)
        
        # Find next index
        idx = 1
        while True:
            exp_name = f"{prompt_id}_{idx:04d}"
            exp_dir = os.path.join(base_dir, exp_name)
            if not os.path.exists(exp_dir):
                return exp_dir
            idx += 1

    def create_snapshot(self, prompt_id, version, variables, provider="gemini"):
        compiled_data = self.compile_prompt(prompt_id, version, variables, provider)
        
        exp_dir = self.get_next_experiment_dir(prompt_id)
        os.makedirs(exp_dir)
        
        # compiled_prompt.txt
        with open(os.path.join(exp_dir, "compiled_prompt.txt"), "w", encoding="utf-8") as f:
            f.write(compiled_data["compiled_prompt"])
            
        # experiment.json
        with open(os.path.join(exp_dir, "experiment.json"), "w", encoding="utf-8") as f:
            json.dump({
                "prompt_id": prompt_id,
                "version": version,
                "provider": provider,
                "prompt_hash": compiled_data["prompt_hash"],
                "variables": variables
            }, f, indent=4)
            
        # runtime_results.json
        with open(os.path.join(exp_dir, "runtime_results.json"), "w", encoding="utf-8") as f:
            json.dump({
                "prompt_hash": compiled_data["prompt_hash"],
                "status": "pending"
            }, f, indent=4)
            
        # summary.json
        with open(os.path.join(exp_dir, "summary.json"), "w", encoding="utf-8") as f:
            json.dump({
                "experiment": exp_dir,
                "timestamp": datetime.now().isoformat()
            }, f, indent=4)
            
        return exp_dir, compiled_data

    def run_test(self, test_file_path):
        with open(test_file_path, "r", encoding="utf-8") as f:
            test_data = json.loads(f.read())
            
        basename = os.path.basename(test_file_path)
        prompt_id = basename.replace(".json", "")
        
        variables = test_data.get("variables", {})
        expected = test_data.get("expected", {})
        
        compiled_data = self.compile_prompt(prompt_id, "latest", variables)
        text = compiled_data["compiled_prompt"]
        
        passed = True
        errors = []
        
        for item in expected.get("contains", []):
            if item not in text:
                passed = False
                errors.append(f"Missing expected text: {item}")
                
        for item in expected.get("not_contains", []):
            if item in text:
                passed = False
                errors.append(f"Found unexpected text: {item}")
                
        return {
            "prompt_id": prompt_id,
            "passed": passed,
            "errors": errors,
            "prompt_hash": compiled_data["prompt_hash"]
        }
