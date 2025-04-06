import { NextApiRequest, NextApiResponse } from 'next';
import { getUserIdentifier, SelfBackendVerifier, countries } from '@selfxyz/core';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { proof, publicSignals } = req.body;

      if (!proof || !publicSignals) {
        return res.status(400).json({ message: 'Proof and publicSignals are required' });
      }

      // Extract user ID from the proof
      const userId = await getUserIdentifier(publicSignals);
      console.log("Extracted userId:", userId);

      // Initialize and configure the verifier
      const selfBackendVerifier = new SelfBackendVerifier(
        'flashdao-volunteer-verification', 
        'https://3cda-2402-7500-a2d-3e67-c934-80ef-4f77-6cdf.ngrok-free.app/api/verify'
      );
      
      // 验证证明
      const result = await selfBackendVerifier.verify(proof, publicSignals);
      
      // 记录所有验证结果和用户属性
      console.log("\n=== VERIFICATION RESULT ===");
      console.log("Is Valid:", result.isValid);
      console.log("Validation Details:", JSON.stringify(result.isValidDetails, null, 2));
      console.log("User ID:", result.userId);
      console.log("Application:", result.application);
      console.log("Nullifier:", result.nullifier);
      
      // 记录所有公开的用户属性
      console.log("\n=== DISCLOSED ATTRIBUTES ===");
      console.log(JSON.stringify(result.credentialSubject, null, 2));
      
      // 添加自定义验证逻辑
      let customValidation = true;
      let customValidationMessage = "";
      
      // 示例: 检查国籍 (如果已披露)
      if (result.credentialSubject.nationality) {
        console.log(`\nUser nationality: ${result.credentialSubject.nationality}`);
        
        // 检查是否来自特定国家
        if (result.credentialSubject.nationality === countries.IRAN || 
            result.credentialSubject.nationality === countries.NORTH_KOREA) {
          customValidation = false;
          customValidationMessage = "Restricted nationality";
          console.log("Nationality check failed: restricted country");
        }
      }
      
      // 检查是否满足年龄要求(18岁)
      if (result.credentialSubject.older_than) {
        console.log(`User is older than: ${result.credentialSubject.older_than}`);
        if (parseInt(result.credentialSubject.older_than) < 18) {
          customValidation = false;
          customValidationMessage = "User age below requirement";
          console.log("Age check failed: user is younger than 18");
        }
      }
      
      // 检查是否披露了护照号码
      if (!result.credentialSubject.passport_number) {
        customValidation = false;
        customValidationMessage = "Passport number not disclosed";
        console.log("Passport check failed: passport number not disclosed");
      } else {
        console.log(`User passport number: ${result.credentialSubject.passport_number}`);
      }
      
      // 示例: 检查姓名 (如果已披露)
      if (result.credentialSubject.name) {
        console.log(`User name: ${result.credentialSubject.name}`);
      }
      
      // 打印完整的结构化数据，方便查看和调试
      console.log("\n=== COMPLETE CREDENTIAL SUBJECT ===");
      const formattedData = {
        timestamp: new Date().toISOString(),
        verification: {
          isValid: result.isValid,
          customValidation,
          validationDetails: result.isValidDetails
        },
        user: {
          userId: result.userId,
          name: result.credentialSubject.name || 'Not disclosed',
          nationality: result.credentialSubject.nationality || 'Not disclosed',
          olderThan: result.credentialSubject.older_than || 'Not disclosed',
        },
        metadata: {
          nullifier: result.nullifier,
          application: result.application,
          merkleRoot: result.credentialSubject.merkle_root
        },
        additionalAttributes: {}
      };
      
      // 添加其他可能存在的属性
      const additionalFields = [
        'passport_number', 'date_of_birth', 'gender', 'expiry_date',
        'issuing_state', 'passport_no_ofac', 'name_and_dob_ofac', 'name_and_yob_ofac'
      ] as const;
      
      additionalFields.forEach(field => {
        // 使用类型断言来解决索引类型问题
        const credSubject = result.credentialSubject as Record<string, unknown>;
        const additionalAttrs = formattedData.additionalAttributes as Record<string, unknown>;
        
        if (credSubject[field] !== undefined) {
          additionalAttrs[field] = credSubject[field];
        }
      });
      
      console.log(JSON.stringify(formattedData, null, 2));
      console.log("\n=== END OF VERIFICATION DATA ===\n");
      
      if (result.isValid && customValidation) {
        // 返回成功验证响应
        return res.status(200).json({
          status: 'success',
          result: true,
          credentialSubject: result.credentialSubject
        });
      } else {
        // 返回验证失败响应
        return res.status(500).json({
          status: 'error',
          result: false,
          message: customValidation ? 'Verification failed' : customValidationMessage,
          details: result.isValidDetails
        });
      }
    } catch (error) {
      console.error('Error verifying proof:', error);
      return res.status(500).json({
        status: 'error',
        result: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
} 