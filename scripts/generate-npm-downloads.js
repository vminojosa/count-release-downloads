const fs = require('fs');

async function getPackages() {
  // Search for all packages containing 'jspsych'
  const url = `https://registry.npmjs.org/-/v1/search?text=jspsych&size=250`;
  const res = await fetch(url);
  const data = await res.json();
  // Only keep packages that start with '@jspsych/' or '@jspsych-contrib/'
  return data.objects
    .map(obj => obj.package.name)
    .filter(name => name.startsWith('@jspsych/') || name.startsWith('@jspsych-contrib/'));
}

async function getDownloadCount(pkg) {
  const url = `https://api.npmjs.org/downloads/point/last-month/${pkg}`;
  const res = await fetch(url);
  const data = await res.json();
  return { package: pkg, downloads: data.downloads || 0 };
}

(async () => {
  let packages = await getPackages();
  packages.push('jspsych'); // ensure core package is included
  packages = Array.from(new Set(packages)); // deduplicate

  // Fetch download counts in parallel for speed
  const results = await Promise.all(
    packages.map(pkg => getDownloadCount(pkg))
  );
  results.sort((a, b) => b.downloads - a.downloads);

  // Count packages by scope
  const jspsychCount = results.filter(row => row.package.startsWith('@jspsych/')).length;
  const contribCount = results.filter(row => row.package.startsWith('@jspsych-contrib/')).length;
  const coreCount = results.filter(row => row.package === 'jspsych').length;
  const totalCount = results.length;

  // Get current date in YYYY-MM-DD format
  const collectedDate = new Date().toISOString().slice(0, 10);

  // Generate HTML with modern styling and color-coded scopes
  let html = `<!DOCTYPE html>\n<html>\n  <head>\n    <title>npm downloads</title>\n    <style>\n      body {\n        font-family: 'Segoe UI', Arial, sans-serif;\n        background: #f7f9fb;\n        color: #222;\n        margin: 0;\n        padding: 2rem;\n      }\n      h1 {\n        text-align: center;\n        font-weight: 600;\n        margin-bottom: 2rem;\n      }\n      .counts {\n        text-align: center;\n        margin-bottom: 2rem;\n        font-size: 1.1em;\n      }\n      .counts span {\n        display: inline-block;\n        margin: 0 1em;\n        padding: 0.2em 0.7em;\n        border-radius: 1em;\n      }\n      .count-core { background: #fffde7; color: #bfa600; }\n      .count-jspsych { background: #e0f7fa; color: #006064; }\n      .count-contrib { background: #f3e8ff; color: #6c2eb7; }\n      .count-total { background: #e0e0e0; color: #222; }\n      .collected-date {\n        text-align: center;\n        color: #888;\n        font-size: 0.95em;\n        margin-bottom: 2rem;\n      }\n      table {\n        margin: 0 auto;\n        border-collapse: collapse;\n        min-width: 420px;\n        background: #fff;\n        box-shadow: 0 2px 12px rgba(0,0,0,0.07);\n        border-radius: 10px;\n        overflow: hidden;\n      }\n      th, td {\n        padding: 0.75rem 1.5rem;\n        text-align: left;\n      }\n      th {\n        background: #22223b;\n        color: #fff;\n        font-weight: 600;\n        letter-spacing: 0.03em;\n      }\n      tr {\n        border-bottom: 1px solid #eaeaea;\n      }\n      tr:last-child {\n        border-bottom: none;\n      }\n      .scope-jspsych {\n        background: #e0f7fa;\n        color: #006064;\n      }\n      .scope-jspsych-contrib {\n        background: #f3e8ff;\n        color: #6c2eb7;\n      }\n      .scope-core {\n        background: #fffde7;\n        color: #bfa600;\n      }\n      tr:hover {\n        background: #f1f1f1;\n      }\n    </style>\n  </head>\n  <body>\n    <h1>Monthly downloads of <span style='color:#006064'>@jspsych</span> & <span style='color:#6c2eb7'>@jspsych-contrib</span> scoped packages</h1>\n    <div class='collected-date'>Data collected: ${collectedDate}</div>\n    <div class='counts'>\n      <span class='count-core'>core: ${coreCount}</span>\n      <span class='count-jspsych'>@jspsych: ${jspsychCount}</span>\n      <span class='count-contrib'>@jspsych-contrib: ${contribCount}</span>\n      <span class='count-total'>total: ${totalCount}</span>\n    </div>\n    <table>\n      <tr><th>Package</th><th>Downloads (last month)</th></tr>\n`;
  for (const row of results) {
    let cls = '';
    if (row.package === 'jspsych') {
      cls = 'scope-core';
    } else if (row.package.startsWith('@jspsych/')) {
      cls = 'scope-jspsych';
    } else if (row.package.startsWith('@jspsych-contrib/')) {
      cls = 'scope-jspsych-contrib';
    }
    html += `      <tr class='${cls}'><td>${row.package}</td><td>${row.downloads}</td></tr>\n`;
  }
  html += `    </table>\n  </body>\n</html>\n`;

  fs.writeFileSync('npm.html', html);
})();
