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

async function getRollingDownloads(pkg) {

  const endDate = new Date();

  const startDate = new Date(endDate);
  startDate.setFullYear(startDate.getFullYear() - 10);

  const oneYearAgo = new Date(endDate);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const months = [];
  const pkgDownloads = [];

  while (startDate <= oneYearAgo) {
    const periodEnd = new Date(startDate);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const downloadCount = await getDownloadCount(pkg,
        startDate.toISOString().slice(0, 10), 
        periodEnd.toISOString().slice(0, 10));
    
    months.push(periodEnd.toISOString().slice(0, 7)); // YYYY-MM format
    pkgDownloads.push(downloadCount.downloads);

    startDate.setMonth(startDate.getMonth() + 1);
  }

  // Generate csvContent
  let csvContent = 'Month, Downloads\n';
  for (let i = 0; i < months.length; i++) {
    csvContent += `${months[i]},${pkgDownloads[i]}\n`;
  }

  // write csvConent to csv file
  const csvPath = path.join(`csv/${pkg.replace(/^(@jspsych\/|@jspsych-contrib\/)/,"")}-data.csv`);
  fs.writeFileSync(csvPath, csvContent);
  console.log('CSV file saved to', csvPath);;
}

async function getDownloadCount(pkg, startDate, endDate) {
  const url = `https://npm-stat.com/api/download-counts?package=${pkg}&from=${startDate}&until=${endDate}/`;
  const res = await fetch(url);
  const data = await res.json();

  const downloads = obj => Object.values(obj[`${pkg}`]).reduce((a, b) => a + b, 0)

  return { package: pkg, downloads: downloads || 0 };
}

(async () => {
  let packages = await getPackages();
  packages.push('jspsych'); // ensure core package is included
  packages = Array.from(new Set(packages)); // deduplicate

  const latest = await Promise.all(
    packages.map(pkg => getDownloadCount(pkg, '2025-03-23', '2025-09-23'))
  );

  latest.sort((a, b) => b.downloads - a.downloads);

  var topPackages = [];
  topPackages.push('jspsych');
  topPackages.push(latest.filter(row => row.package.startsWith('@jspsych/')).slice(0, 2).map(row => row.package));
  topPackages.push(latest.filter(row => row.package.startsWith('@jspsych-contrib')).slice(0, 2).map(row => row.package));
  topPackages = topPackages.flat();

  // Fetch download counts in parallel for speed
  const results = await Promise.all(
    topPackages.map(pkg => getRollingDownloads(pkg))
  );
})();