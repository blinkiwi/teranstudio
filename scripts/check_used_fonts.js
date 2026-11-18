const fs = require('fs');
const data = JSON.parse(fs.readFileSync('raw_site/server_data.json', 'utf8'));
const mag = data.mags.mag;

console.log('used_webtype_fonts:', mag.used_webtype_fonts);
console.log('used_typetoday_fonts:', mag.used_typetoday_fonts);
console.log('used_custom_fonts:', mag.used_custom_fonts);
console.log('used_google_fonts:', mag.used_google_fonts);
console.log('used_typekit_fonts:', mag.used_typekit_fonts);
console.log('textStyles count:', Object.keys(mag.textStyles || {}).length);
console.log('textStyles:', JSON.stringify(mag.textStyles, null, 2));
