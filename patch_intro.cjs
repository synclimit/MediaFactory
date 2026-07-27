const fs = require('fs');
let dash = fs.readFileSync('src/components/m4/M4ProgressiveDashboard.jsx', 'utf8');
const lost = fs.readFileSync('lost_intro_code.txt', 'utf8');

const target = `                           <input type="checkbox" className="accent-orange-500" checked={getIntroProp('visible', false)} onChange={e => updateIntroProp('visible', e.target.checked)} />\n                        </div>`;

if (dash.includes(target)) {
    dash = dash.replace(target, target + '\n' + lost);
    fs.writeFileSync('src/components/m4/M4ProgressiveDashboard.jsx', dash);
    console.log("Patched successfully");
} else {
    console.log("Target not found");
}
