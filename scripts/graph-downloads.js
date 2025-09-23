import fs from "fs";
import path from "path";

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

  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setFullYear(startDate.getFullYear() - 10);
  startDate.toISOString().split('T')[0];
  endDate.toISOString().split('T')[0];

  const url = `https://npm-stat.com/api/download-counts?package=${pkg}&from=${startDate}&until=${endDate}/`;
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

  results.filter(row => row.package.startsWith('@jspsych/')).slice(0, 2);

  // Generate csvContent
  let csvContent = 'Package, Downloads\n';
  for (let i = 0; i < results.length; i++) {
    csvContent += `${results[i].package},${results[i].downloads}\n`;
    console.log(results[i]);
  }

  // write csvConent to csv file
  const csvPath = path.join('contributor-data.csv');
  fs.writeFileSync(csvPath, csvContent);
  console.log('CSV file saved to', csvPath);
})();