import os
import sys
import argparse
from prompt_manager import PromptManager, PROMPT_REGISTRY_DIR

sys.stdout.reconfigure(encoding='utf-8')

def print_tree(dir_path, prefix=""):
    if not os.path.exists(dir_path):
        return
        
    entries = sorted(os.listdir(dir_path))
    entries = [e for e in entries if os.path.isdir(os.path.join(dir_path, e))]
    
    for i, entry in enumerate(entries):
        path = os.path.join(dir_path, entry)
        is_last = (i == len(entries) - 1)
        connector = "└── " if is_last else "├── "
        print(f"{prefix}{connector}{entry}")
        
        extension = "    " if is_last else "│   "
        print_tree(path, prefix + extension)

def cmd_graph(args):
    print("Prompt Registry")
    for domain in sorted(os.listdir(PROMPT_REGISTRY_DIR)):
        domain_path = os.path.join(PROMPT_REGISTRY_DIR, domain)
        if os.path.isdir(domain_path):
            print(domain)
            print_tree(domain_path)
            print()

def cmd_stats(args):
    manager = PromptManager()
    try:
        prompt_content, manifest_content, manifest = manager.load_package(args.prompt_id, args.version)
        fingerprint = manager.generate_fingerprint(prompt_content, manifest_content)
        
        chars = len(prompt_content)
        lines = len(prompt_content.splitlines())
        variables = len(manifest.get("variables", []))
        req_vars = len(manifest.get("required_variables", []))
        tokens = chars // 4
        
        complexity = "Low"
        if variables > 3 or lines > 10:
            complexity = "Medium"
        if variables > 8 or lines > 30:
            complexity = "High"
            
        print(f"Prompt Version: {args.version}")
        print(f"Characters: {chars}")
        print(f"Lines: {lines}")
        print(f"Variables: {variables}")
        print(f"Required Variables: {req_vars}")
        print(f"Prompt Hash: {fingerprint}")
        print(f"Manifest Version: {manifest.get('version', '1.0.0')}")
        print(f"Estimated Tokens: {tokens}")
        print(f"Prompt Complexity: {complexity}")
    except Exception as e:
        print(f"Error: {e}")

def cmd_test(args):
    manager = PromptManager()
    test_dir = os.path.join(os.path.dirname(__file__), "prompts", "tests")
    if not os.path.exists(test_dir):
        print("No tests found.")
        return
        
    for filename in os.listdir(test_dir):
        if filename.endswith(".json"):
            print(f"Running test: {filename}")
            path = os.path.join(test_dir, filename)
            result = manager.run_test(path)
            if result["passed"]:
                print(f"[PASS] {filename}")
            else:
                print(f"[FAIL] {filename}")
                for err in result["errors"]:
                    print(f"  - {err}")
            print(f"  Hash: {result['prompt_hash']}\n")

def cmd_snapshot(args):
    manager = PromptManager()
    
    # Simple defaults for snapshot
    variables = {
        "keyword": "lagu rock",
        "language": "Indonesia",
        "provider": "Gemini",
        "content_type": "Music"
    }
    
    try:
        exp_dir, data = manager.create_snapshot(args.prompt_id, args.version, variables)
        print(f"Snapshot created at {exp_dir}")
        print(f"Prompt Hash: {data['prompt_hash']}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Prompt Laboratory CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)
    
    # graph
    graph_parser = subparsers.add_parser("graph")
    
    # stats
    stats_parser = subparsers.add_parser("stats")
    stats_parser.add_argument("prompt_id")
    stats_parser.add_argument("--version", default="latest")
    
    # test
    test_parser = subparsers.add_parser("test")
    
    # snapshot
    snapshot_parser = subparsers.add_parser("snapshot")
    snapshot_parser.add_argument("prompt_id")
    snapshot_parser.add_argument("--version", default="latest")
    
    args = parser.parse_args()
    
    if args.command == "graph":
        cmd_graph(args)
    elif args.command == "stats":
        cmd_stats(args)
    elif args.command == "test":
        cmd_test(args)
    elif args.command == "snapshot":
        cmd_snapshot(args)
