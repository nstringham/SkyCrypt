/**
 * renders the resources
 * @param {{page:string, fileHashes:{css:{[key:string]:string}}, fileNameMap:{[key:string]:string}, extra:any}} options
 * @returns {string} HTML
 */
function render({ page, fileHashes, fileNameMap, extra }) {
  return /*html*/ `
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover">
<meta property="og:site_name" content="SkyCrypt">
<link rel="sitemap" href="/sitemap.xml">
<link rel="manifest" href="/manifest.webmanifest" crossorigin="use-credentials">
<link rel="search" type="application/opensearchdescription+xml" title="SkyCrypt" href="/search.osd">
<meta name="theme-color" content="#282828">
<meta name="apple-mobile-web-app-title" content="SkyCrypt">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="apple-touch-icon" sizes="180x180" href="/resources/img/app-icons/square-180.png">
<link rel="apple-touch-icon" sizes="512x512" href="/resources/img/app-icons/square-512.png">
<link rel="apple-touch-startup-image" href="/resources/img/ios-launch-screen/iPhone12ProMax.png" media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)">
<link rel="apple-touch-startup-image" href="/resources/img/ios-launch-screen/iPhone12.png" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)">
<link rel="apple-touch-startup-image" href="/resources/img/ios-launch-screen/iPhoneXsMax.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)">
<link rel="apple-touch-startup-image" href="/resources/img/ios-launch-screen/iPhoneXr.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)">
<link rel="apple-touch-startup-image" href="/resources/img/ios-launch-screen/iPhoneX.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)">
<link rel="apple-touch-startup-image" href="/resources/img/ios-launch-screen/iPhone8Plus.png" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)">
<link rel="apple-touch-startup-image" href="/resources/img/ios-launch-screen/iPhone8.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)">
<link rel="preconnect" href="https://fonts.gstatic.com/" crossorigin>
<link rel="stylesheet" href="/resources/css/index.css?${fileHashes.css["index.css"]}">
<link rel="preload" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">

<script async src="https://www.googletagmanager.com/gtag/js?id=UA-185827357-1"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  gtag('js', new Date());

  gtag('config', 'UA-185827357-1');
</script>
<script data-ad-client="ca-pub-7573886460664405" async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>

${
  page == "stats"
    ? /*html*/ `
      <link rel="preload" href="/resources/css/inventory.css?${fileHashes.css["inventory.css"]}" as="style" onload="this.onload=null;this.rel='stylesheet'">
      <script async type="module" src="/resources/js/${fileNameMap["localTimeElement"]}"></script>
      <script defer type="module" src="/resources/js/${fileNameMap["stats-defer"]}"></script>
    `
    : ""
}

<script defer type="module" src="/resources/js/${fileNameMap["common-defer"]}"></script>

<script> const page = "${page}"; </script>
<script> const extra = JSON.parse(\`${JSON.stringify(extra).replace(/\\/g, "\\\\")}\`); </script>

<script src="/resources/js/${fileNameMap["common"]}"></script>

<script async defer src="/resources/js/${fileNameMap["browser-compat-check"]}"></script>
  `;
}

module.exports = {
  render,
};
