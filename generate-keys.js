const crypto = require('crypto');
const fs     = require('fs');

const SECRET = 'E0n-yS6uN4jT7mP8xK2rV1cG3bH2026';
const PREFIX = 'EON';
const COUNT  = 1000;

const keys = [];
for (let i = 1; i <= COUNT; i++) {
    const serial = String(i).padStart(4, '0');
    const hash   = crypto.createHmac('sha256', SECRET)
        .update(`${PREFIX}-${serial}`)
        .digest('hex').toUpperCase().slice(0, 8);
    keys.push(`${PREFIX}-${serial}-${hash.slice(0, 4)}-${hash.slice(4, 8)}`);
}

fs.writeFileSync('essenceon-keys.csv', 'Key\n' + keys.join('\n'), 'utf8');
console.log(`✅ ${COUNT}개 키 생성 완료 → essenceon-keys.csv`);
