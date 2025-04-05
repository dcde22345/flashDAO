// 測試OpenZeppelin導入是否工作正常
const fs = require('fs');
const path = require('path');

// 檢查OpenZeppelin合約路徑
const ozPathERC20 = path.join(__dirname, '../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol');
const ozPathAccessControl = path.join(__dirname, '../node_modules/@openzeppelin/contracts/access/AccessControl.sol');
const ozPathMath = path.join(__dirname, '../node_modules/@openzeppelin/contracts/utils/math/Math.sol');

console.log('檢查OpenZeppelin合約是否存在:');
console.log(`ERC20.sol: ${fs.existsSync(ozPathERC20) ? '存在' : '不存在'}`);
console.log(`AccessControl.sol: ${fs.existsSync(ozPathAccessControl) ? '存在' : '不存在'}`);
console.log(`Math.sol: ${fs.existsSync(ozPathMath) ? '存在' : '不存在'}`);

// 檢查node_modules目錄
const nodeModulesPath = path.join(__dirname, '../node_modules');
console.log(`node_modules目錄: ${fs.existsSync(nodeModulesPath) ? '存在' : '不存在'}`);

// 列出OpenZeppelin目錄
const ozPath = path.join(__dirname, '../node_modules/@openzeppelin');
if (fs.existsSync(ozPath)) {
  console.log('\n@openzeppelin目錄內容:');
  fs.readdirSync(ozPath).forEach(file => {
    console.log(`- ${file}`);
  });
} else {
  console.log('\n@openzeppelin目錄不存在');
}

// 嘗試導入@types/node
try {
  require('@types/node');
  console.log('\n@types/node導入成功');
} catch (error) {
  console.log(`\n@types/node導入失敗: ${error.message}`);
}

console.log('\n如果文件都存在但solidity編譯器仍然報錯，可能是路徑解析問題');
console.log('嘗試修改導入路徑為相對路徑: "../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol"'); 