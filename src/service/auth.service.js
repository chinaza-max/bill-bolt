import jwt from "jsonwebtoken";
import bcrypt from'bcrypt';
import { 
    User, 
    PasswordReset , 
    EmailandTelValidation
   } from "../db/models/index.js";
import serverConfig from "../config/server.js";
import authUtil from "../utils/auth.util.js";
import userService from "../service/user.service.js";
import { Buffer } from 'buffer';
import mailService from "../service/mail.service.js";
import axios from'axios';

import {
  ConflictError,
  SystemError,
  NotFoundError
} from "../errors/index.js";
import { Op } from "sequelize";



class AuthenticationService {
  UserModel = User;
  PasswordResetModel=PasswordReset;
  EmailandTelValidationModel=EmailandTelValidation;
 



  verifyToken(token) {
    try {
      const payload = jwt.verify(
        token,
        serverConfig.TOKEN_SECRET
      );
      return {
        payload,
        expired: false,
      };
    } catch (error) {
      return {
        payload: null,
        expired: error.message.includes("expired") ? error.message : error,
      };
    }
  }


  async handleUserCreation(data) {
      let { 
        firstName,
        lastName,
        emailAddress,
        password,
        tel,
        telCode,
      } = await authUtil.verifyUserCreationData.validateAsync(data);
  
    let hashedPassword;
    try {

      hashedPassword = await bcrypt.hash(
        password,
        Number(serverConfig.SALT_ROUNDS)
      );
      
    } 
    catch (error) { 
      console.log(error)
      throw new SystemError(error);
    }

      let existingUser = await this.isUserEmailExisting(emailAddress,this.UserModel);

      if (existingUser != null)throw new ConflictError(existingUser);
  
      try {
        const user = await this.UserModel.create({
          firstName,
          lastName,
          emailAddress,
          password:hashedPassword,
          tel,
          telCode,
      });

      const validateFor="user"
      await this.sendEmailVerificationCode(user.emailAddress,user.id,validateFor)
      
      return user;
  
      } catch (error) {
        console.log(error)
        throw new SystemError(error.name,error.parent)
      }
  

  }


  /*
  async handleSendVerificationCodeEmailOrTel(data) {

    let { 
      userId,
      type,
      validateFor
    } = await authUtil.verifyHandleSendVerificationCodeEmailOrTel.validateAsync(data);

    let relatedUser

    if(validateFor=='rent'){
      relatedUser = await this.ProspectiveTenantModel.findOne({
        where: { id: userId },
      });
    }
    else if(validateFor=='list'){
      relatedUser = await this.PropertyManagerModel.findOne({
        where: { id: userId },
      });
    }
    else{
      relatedUser = await this.AdminModel.findOne({
        where: { id: userId },
      });
    }
   
    if(!relatedUser) throw new NotFoundError("No user found")
    if(type==='email'){
      await this.sendEmailVerificationCode(relatedUser.emailAddress,relatedUser.id, validateFor)
    }else{
      await this.sendTelVerificationCode(relatedUser.tel,relatedUser.id)
    }

  }

  async handleSendPasswordResetLink(data) {
    const { emailOrPhone , type } = await authUtil.validateHandleSendPasswordResetLink.validateAsync(data);


    let matchedUser

    if(type=="list"){

      try {

        matchedUser=await this.PropertyManagerModel.findOne({
          where: {
        [Op.or]: [
          { emailAddress:emailOrPhone},
          { tel: emailOrPhone }, 
        ],
        isEmailValid:true, 
        disableAccount:false, 
        isDeleted:false
      }
      });
        
      } catch (error) {

          console.log(error)
          throw new SystemError(error.name , error.parent)
      }

    }
    else{
      try {

        matchedUser=await this.ProspectiveTenantModel.findOne({
          where: {
        [Op.or]: [
          { emailAddress:emailOrPhone},
          { tel: emailOrPhone }, 
        ],
        isEmailValid:true, 
        disableAccount:false, 
        isDeleted:false
      }
      });
        
      } catch (error) {
          console.log(error)
          throw new SystemError(error.name , error.parent)
      }

    }
    
    if (matchedUser == null){
      throw new NotFoundError("This email does not correspond to any user");
    }
    var keyExpirationMillisecondsFromEpoch =
      new Date().getTime() + 30 * 60 * 1000;
    var generatedKey = this.generatePassword(true);

    let uniqueId=matchedUser.id+'_'+type
    var relatedPasswordReset = await this.PasswordResetModel.findOrCreate({
      where: {
        userId: uniqueId,
      },
      defaults: {
        userId: uniqueId,
        resetKey: generatedKey,
        expiresIn: new Date(keyExpirationMillisecondsFromEpoch),
      },
    });

    relatedPasswordReset[0]?.update({
      resetKey: generatedKey,
      expiresIn: new Date(keyExpirationMillisecondsFromEpoch),
    });

    const params = new URLSearchParams();
    params.append('key', generatedKey);
    params.append('Exkey',keyExpirationMillisecondsFromEpoch);

    await mailService.sendMail({
      to: matchedUser.emailAddress,
      subject: "Reset Password",
      templateName: "reset_password",
      variables: {
        resetLink:serverConfig.NODE_ENV==='development'?`http://localhost/COMPANYS_PROJECT/ResetPassword/sendPasswordLink.html?${params.toString()}`: `${serverConfig.DOMAIN}/adminpanel/Passwor?${params.toString()}`
      },
    });


  }

  generatePassword(omitSpecial = false, passwordLength = 12) {
    var chars = omitSpecial
      ? "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
      : "0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    // var passwordLength = 12;
    var password = "";
    for (var i = 0; i <= passwordLength; i++) {
      var randomNumber = Math.floor(Math.random() * chars.length);
      password += chars.substring(randomNumber, randomNumber + 1);
    }
    return password;
  }
  
  async authorizeTransfer(body) {

   

    try {

      const transactionStatus = await this.authorizeSingleTransfer(body.reference,body.authorizationCode);


    } catch (error) {
        console.log(error)
    }
   

  }


  async handleWebHookMonifyRefund(data) {

    const { eventType, eventData } = data

    const { refundReference } = eventData;

    try {

      const transactionStatus = await this.getRefundTransactionStatus(refundReference);

      this.processRefund(transactionStatus)

    } catch (error) {
        console.log(error)
    }
   

  }

  async processRefund(transactionStatus){

    const {transactionReference}=transactionStatus

    if(paymentReference.startsWith("refund_inspection")){
            
      const RefundLogModelResult  = await this.RefundLogModel.findOne({
        where: { transactionReference },
      });

      const InspectionModelResult  = await this.InspectionModel.findOne({
        where: { transactionReference },
      });

      await RefundLogModelResult.update({
        paymentStatus:transactionStatus.refundStatus,
        transactionReference :transactionReference
      });

      if(transactionStatus.refundStatus==="COMPLETED"){
        await InspectionModelResult.update({
          inspectionStatus: 'refunded',
        });

        const BuildingModelResult  = await this.BuildingModel.findOne({
          where: { id:RefundLogModelResult.buildingId },
        });

        await BuildingModelResult.update({
          availability:'vacant'
        });

      }

    }
  }
  

  async handleWebHookMonifyDisbursement(data) {

    const { eventData } = data
 
    const {reference } = eventData;
    
    const paymentReference=reference

    try {
      
      const transactionStatus = await this.getTransactionStatusDisbursement(paymentReference);
      this.handleDisbursement(transactionStatus)
     
    } catch (error) {
      throw new SystemError(error.name,  error.parent)
    }

  }


  async handleDisbursement(transactionStatus){


    const  {reference, transactionReference}=transactionStatus
    const paymentReference=reference

    try {

      
      try {
        const TransactionModelResult= await this.TransactionModel.findOne({
          where:{
            paymentReference:paymentReference
          }
        })

        if (TransactionModelResult) {

          if(transactionStatus.reference.startsWith("firstRent")){

            await TransactionModelResult.update({
              paymentStatus:transactionStatus.status,
              transactionReference
            });
      

            if(transactionStatus.status==="SUCCESS"){

              const InspectionModelResult=await this.InspectionModel.findOne({
                where:{
                  id:TransactionModelResult.inspectionId
                }
              })

    
              InspectionModelResult.update({
                landlordPaidStatus:true
              })


              if(InspectionModelResult.agentPaidStatus==true){

                InspectionModelResult.update({
                  inspectionStatus:"disbursed"
                })
              }
    
                const BuildingModelResult=await this.BuildingModel.findByPk(TransactionModelResult.buildingId)

                if(BuildingModelResult){

                  const TenantModelResult=await this.TenantModel.findOne({
                        where:{
                          status: {
                            [Op.or]: ['active', 'rentDue']
                          },
                          buildingId:TransactionModelResult.buildingId
                        }
                  })

                  if(!TenantModelResult){
                    this.TenantModel.create({
                      buildingId:TransactionModelResult.buildingId,
                      prospectiveTenantId:TransactionModelResult.userId,
                      status:'active',
                      rentNextDueDate:userService.calculateRentNextDueDate(BuildingModelResult.rentalDuration)
                    })
                  }

                }
              

            }
    
          } 
          else if(transactionStatus.reference.startsWith("commission")){


            await TransactionModelResult.update({
              paymentStatus:transactionStatus.status,
              transactionReference
            });

            
            if(transactionStatus.status==="SUCCESS"){


              const InspectionModelResult=await this.InspectionModel.findOne({
                where:{
                  id:TransactionModelResult.inspectionId
                },
                order: [['createdAt', 'DESC']]
              })
    
              InspectionModelResult.update({
                agentPaidStatus:true
              })

              if(InspectionModelResult.landlordPaidStatus==true){
                InspectionModelResult.update({
                  inspectionStatus:"disbursed"
                })
              }

            }

          }
          else if(transactionStatus.reference.startsWith("rent")){

            await TransactionModelResult.update({
              paymentStatus:transactionStatus.status,
              transactionReference
            });

          }

        }
        
      } catch (error) {
        console.error('An error occurred while updating the transaction:', error.message);
      }

    } catch (error) {
      throw new SystemError(error.name,  error.parent)
    }
  }


  async handleWebHookCollectionMonify(data) {

    const { eventType, eventData } = data

    const { transactionReference} = eventData;

    try {

      console.log(transactionReference)
      const transactionStatus = await this.getTransactionStatus(transactionReference);

      //console.log(transactionStatus)

      this.handlePaymentCollection(transactionStatus)

    } catch (error) {
      console.log(error)
      throw new SystemError(error.name,  error.parent)
    }

  }

  async handlePaymentCollection(transactionStatus){
    try {

      if(transactionStatus.paymentReference.startsWith("appointmentAndRent")){
        const {amountPaid ,metaData, paymentReference, transactionReference}=transactionStatus
        const { userId, buildingId, transactionType}=metaData
        //console.log(metaData)

        const existingTransaction = await this.TransactionModel.findOne({
          where: {
            paymentReference
          }
        })

        if(existingTransaction){

          await existingTransaction.update({
            paymentStatus: transactionStatus.paymentStatus
          });

        }else{

          await this.TransactionModel.create({
            userId,
            buildingId,
            amount:amountPaid,
            transactionReference,
            paymentReference,
            transactionType,
            paymentStatus:transactionStatus.paymentStatus
          })
        }


      if(transactionStatus.paymentStatus=="PAID"){

        const BuildingModelResponse = await this.BuildingModel.findByPk(buildingId);
        BuildingModelResponse.update({
          availability:"booked"
        });

          const existingInspection = await this.InspectionModel.findOne({
          where: {
            buildingId,
            prospectiveTenantId: userId,
            inspectionStatus: "pending"
          },
        });
       
        if(!existingInspection){

          await this.InspectionModel.create({
            transactionReference,
            buildingId,
            prospectiveTenantId:userId
          })

        }

      }
      }
      else if(transactionStatus.paymentReference.startsWith("rentInvoice")){

        const TransactionModelResult=await this.TransactionModel.findOne({
          where:{
            paymentReference:transactionStatus.paymentReference
          }
        })

        if(TransactionModelResult){
          
          await TransactionModelResult.update({
            paymentStatus:transactionStatus.paymentStatus,
            transactionReference:transactionStatus.transactionReference
          });

        }

        if(transactionStatus.paymentStatus=="PAID"){
          const TenantModelResult=await this.TenantModel.findOne({
            where:{
              prospectiveTenantId:TransactionModelResult.userId,
              buildingId:TransactionModelResult.buildingId
            }
          })

          const BuildingModelResult=await this.BuildingModel.findOne({
            where:{
              id:TransactionModelResult.buildingId
            }
          })

          if(TenantModelResult.paymentReference===transactionStatus.paymentReference){

          }
          else{

            TenantModelResult.update({
              status:'active',
              rentNextDueDate:userService.calculateRentNextDueDate(BuildingModelResult.rentalDuration,TenantModelResult.rentNextDueDate),
              paymentReference:transactionStatus.paymentReference
            })
  
            this.disburseRent(BuildingModelResult,TransactionModelResult.userId)
          }
         
        }

      }

  } catch (error) {
    console.log(error)
    throw new SystemError(error.name,  error.parent)
  }
  }


  async disburseRent(BuildingModel,prospectiveTenantId){

    const PropertyManagerModelResult=await this.PropertyManagerModel.findOne({
      where:{
        id:BuildingModel.propertyManagerId,
      }
    })

    const paymentReference="rent"+"_"+userService.generateReference()
    const authToken = await this.getAuthTokenMonify();

      const TransactionModelResultAmount=BuildingModel.price

        await this.TransactionModel.create({
          userId: prospectiveTenantId,
          buildingId:BuildingModel.id,
          amount:TransactionModelResultAmount,
          paymentReference,
          transactionType:'rent'
        });

        const transferDetails = {
          amount: userService.calculateDistribution(TransactionModelResultAmount, 'landlord', true, 'rent').landlordShare,
          reference: paymentReference,
          narration: 'Rent Payment ',
          destinationBankCode: PropertyManagerModelResult.landlordBankCode,
          destinationAccountNumber: PropertyManagerModelResult.landlordBankAccount,
          currency: 'NGN',
          sourceAccountNumber: serverConfig.MONNIFY_ACC,
          async:true
        };
        
        await this.initiateTransfer(authToken, transferDetails);
  }
  

  async handleIntializePayment(data) {

      try {

        const { transactionReference } = await authUtil.verifyHandleIntializePayment.validateAsync(data);

        const transactionStatus = await this.getTransactionStatus(transactionReference);

        this.handlePaymentCollection(transactionStatus)
   
      } catch (error) {
          console.log(error)
      }

  }


  
  async handleValidateBankAccount(data) {

    var {  accountNumber, bankCode } =
      await authUtil.validateHandleValidateBankAccount.validateAsync(data);

    const accessToken = await this.getAuthTokenMonify()
    try {
      const response = await axios.get(`${serverConfig.MONNIFY_BASE_URL}/api/v1/disbursements/account/validate`, {
        params: {
          accountNumber: accountNumber,
          bankCode: bankCode
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });
  
      // Check if the request was successful
      if (response.data.requestSuccessful) {
        return response.data.responseBody; // Return the data if validation is successful
      } else {
        throw new Error('Validation failed');
      }
    } catch (error) {
      throw new ServerError("Failed to update password");
    }
  }


  async handleResetPassword(data) {

    var {  password, resetPasswordKey } =
      await authUtil.validatePasswordReset.validateAsync(data);


    var relatedPasswordReset = await this.PasswordResetModel.findOne({
      where: {
        resetKey: resetPasswordKey,
      },
    });
    
    if (relatedPasswordReset == null)
      throw new NotFoundError("Invalid reset link");
    else if (relatedPasswordReset.expiresIn.getTime() < new Date().getTime())
      throw new NotFoundError("Reset link expired");

      const parts = relatedPasswordReset.userId.split('_');
      let relatedUser=null
      let type=parts[1]
      let userId=parts[0]

      if(type=='list'){
        relatedUser = await this.PropertyManagerModel.findOne({
          where: { id: userId },
        });
      }
      else{
        relatedUser = await this.ProspectiveTenantModel.findOne({
          where: { id: userId },
        });
      }
     

    if (relatedUser == null)
      throw new NotFoundError("Selected user cannot be found");
    try {
      var hashedPassword = await bcrypt.hash(
        password,
        Number(serverConfig.SALT_ROUNDS)
      );

      relatedUser.update({
        password: hashedPassword,
      });
      relatedPasswordReset.update({
        expiresIn: new Date(),
      });
    } catch (error) {
      throw new ServerError("Failed to update password");
    }
  }

  async  initiateTransfer(token, transferDetails) {
    const response = await axios.post(
      `${serverConfig.MONNIFY_BASE_URL}/api/v2/disbursements/single`,
      transferDetails,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    return response.data;
  }

  async  getAuthTokenMonify() {             

    try {

      const apiKey = serverConfig.MONNIFY_API_KEY;
      const clientSecret = serverConfig.MONNIFY_CLIENT_SECRET;
      const authHeader = `Basic ${Buffer.from(`${apiKey}:${clientSecret}`).toString('base64')}`;


      const response = await axios.post(`${serverConfig.MONNIFY_BASE_URL}/api/v1/auth/login`, {}, {
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
      });
  
      return response.data.responseBody.accessToken;
    } catch (error) {
      console.error('Error fetching auth token:', error);
      throw error;
    }
  }
  

  async  getTransactionStatus(transactionReference) {
    const authToken = await this.getAuthTokenMonify();


    try {
      const encodedTransactionReference = encodeURIComponent(transactionReference)
      const response = await axios.get(`${serverConfig.MONNIFY_BASE_URL}/api/v2/merchant/transactions/query?transactionReference=${encodedTransactionReference}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
      });

      //console.log(response.data.responseBody)

      return response.data.responseBody;
    } catch (error) {   
      console.error('Error fetching transaction status:', error?.message);
       
      console.error('Error fetching transaction status:', error.response.data);
      //throw error;
    }
  }

  async  getRefundTransactionStatus(refundReference) {
    const authToken = await this.getAuthTokenMonify();


    try {
      // const encodedTransactionReference = encodeURIComponent(transactionReference)
      const response = await axios.get(`${serverConfig.MONNIFY_BASE_URL}/api/v1/refunds/${refundReference}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
      });

      //console.log(response.data.responseBody)

      return response.data.responseBody;
    } catch (error) {   
      console.error('Error fetching transaction status:', error?.message);
       
      console.error('Error fetching transaction status:', error.response.data);
      //throw error;
    }
  }


  async  getTransactionStatusDisbursement(Reference) {
    const authToken = await this.getAuthTokenMonify();

    try {
      const response = await axios.get(`${serverConfig.MONNIFY_BASE_URL}/api/v2/disbursements/single/summary?reference=${Reference}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
      });


      return response.data.responseBody;
    } catch (error) {   
      console.error('Error fetching transaction status:', error?.message);
       
      console.error('Error fetching transaction status:', error.response.data);
      //throw error;
    }
  }

  async authorizeSingleTransfer(reference, authorizationCode) {
    const authToken = await this.getAuthTokenMonify();

    try {
      const response = await axios.post(`${serverConfig.MONNIFY_BASE_URL}/api/v2/disbursements/single/validate-otp`, 
      {
        reference,
        authorizationCode
      }, 
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      // Handle the response
      return response.data.responseBody;
    } catch (error) {
      console.error('Error authorizing single transfer:', error?.message); 
      console.error('Error authorizing single transfer:', error.response?.data);
      throw error;
    }
  }


  async  getTransactionStatus2(transactionReference) {
    const authToken = await this.getAuthTokenMonify();
    
    try {

      const encodedTransactionReference = encodeURIComponent(transactionReference);

      const response = await axios.get(`${serverConfig.MONNIFY_BASE_URL}/api/v2/disbursements/single/summary?reference=${encodedTransactionReference}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
      });

   
      return response.data.responseBody;

    } catch (error) {   
      console.error('Error fetching transaction status:', error?.message);
       
      console.error('Error fetching transaction status:', error.response.data);
      //throw error;
    }
  }



  async  getTransactionStatusSingleTransfer(transactionReference) {
    const authToken = await this.getAuthTokenMonify();
  
    try {
      const response = await axios.get(`${serverConfig.MONNIFY_BASE_URL}/api/v2/disbursements/single/summary?transactionReference=${transactionReference}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
  
      return response.data.responseBody;
    } catch (error) {
      console.error('Error fetching transaction status:', error);
      throw error;
    }
  }

  
  
  
  async  updateTransactionStatusCronJobWebHook(transaction, status) {
    try {
      transaction.paymentStatus = status;
      await transaction.save();

      if(status=="PAID"&&transaction.transactionType=='appointmentAndRent'){

        const BuildingModelResponse = await this.BuildingModel.findByPk(transaction.buildingId);
        BuildingModelResponse.update({
          availability:"booked"
        })

        await this.InspectionModel.create({
          transactionReference,
          buildingId:transaction.buildingId,
          prospectiveTenantId:transaction.userId,
        });

      }
     

      console.log(`Transaction ${transaction.transactionReference} updated to ${status}`);
    } catch (error) {
      console.error('Error updating transaction:', error.message);
    }
  }



  async  updateTransactionStatusCronJobSingleTransfer(transaction, status) {
    try {
      transaction.paymentStatus = status;
      await transaction.save();

      if(status=="SUCCESS"&&transaction.transactionType=='commissionOrRent'){

        const TenantModelResult=await this.TenantModel.findOne({
          where:{
            buildingId:transaction.buildingId
          }
        })
        
        if(!TenantModelResult||TenantModelResult.status=='terminated'){

          this.TenantModel.create({
            buildingId:transaction.buildingId,
            prospectiveTenantId:transaction.prospectiveTenantId,
            status:'active',
            rentNextDueDate:userService.calculateRentNextDueDate(BuildingModelResult.rentalDuration)
          })
        }

      }
     
    } catch (error) {
      console.error('Error updating transaction:', error.message);
    }
  }


  async checktransactionUpdateWebHook() {

    try {
      // Get all transactions with 'pending' or 'unverified' status
      const transactions = await this.TransactionModel.findAll({
        where: {
          paymentStatus: ['pending', 'unverified']
        }
      });
  
      if (transactions.length > 0) {

        // Get Monify authentication token
        const authToken = await this.getAuthTokenMonify();
        if (!authToken) return;
  
        // Check and update each transaction
        for (const transaction of transactions) {

          const transactionStatus = await this.getTransactionStatus(transaction.transactionReference);
  
          if (transactionStatus) {
            await this.updateTransactionStatusCronJobWebHook(transaction, transactionStatus.paymentStatus);
          }
        }
      } else {
        console.log('No pending or unverified transactions found');
      }
    } catch (error) {
      console.error('Error during cron job:', error.message);
    }
  }

  async checktransactionUpdateSingleTransfer() {

    try {
      // Get all transactions with 'pending' or 'unverified' status
      const transactions = await this.TransactionModel.findAll({
        where: {
          paymentStatus: ['pending', 'unverified']
        }
      });
  
      if (transactions.length > 0) {

        // Get Monify authentication token
        const authToken = await this.getAuthTokenMonify();
        if (!authToken) return;
  
        // Check and update each transaction
        for (const transaction of transactions) {

          const transactionStatus = await this.getTransactionStatusSingleTransfer(transaction.transactionReference, authToken);
  
          if (transactionStatus) {
            await this.updateTransactionStatusCronJobSingleTransfer(transaction, transactionStatus.paymentStatus);
          }
        }
      } else {
        console.log('No pending or unverified transactions found');
      }
    } catch (error) {
      console.error('Error during cron job:', error.message);
    }
  }

  async updateRefundStatusCronJob(refund, responseBody) {
    try {

      if (responseBody.refundStatus=="COMPLETED") {

        const RefundLogModelResult = await this.RefundLogModel.findByPk(responseBody.refundReference);
        await RefundLogModelResult.update({
          refundStatus: 'COMPLETED'
        });


        const inspection = await this.InspectionModel.findOne({
          where: { transactionReference: responseBody.transactionReference, isDeleted: false }
        });

        if(RefundLogModelResult.role=='list'){

          await inspection.update({
            inspectionStatus: 'refunded',
            note:refundResponse.responseBody.refundReason,
            propertyManagerStatus:false
          });
        }else{
          await inspection.update({
            inspectionStatus: 'refunded',
            note:refundResponse.responseBody.refundReason,
            tenentStatus:false
          });
        }

      } 
      else {
        refund.update({
          refundStatus:refundResponse.responseBody.refundStatus
        })
      }
  
    } catch (error) {
      console.error('Error updating refund:', error.message);
    }
  }

  /*
  async  getRefundStatus(transactionReference, authToken) {
    try {
      const response = await axios.get(`{{base_url}}/api/v1/refunds/${transactionReference}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
  
      if (response.data.requestSuccessful) {
        return response.data.responseBody;
      } else {
        console.error(`Error retrieving refund status: ${response.data.responseMessage}`);
        return null;
      }
    } catch (error) {
      console.error('Error fetching refund status:', error.message);
      return null;
    }
  }*/
  /*

  async checkRefundUpdate() {
    try {
      // Get all refunds that are not completed
      const refunds = await this.RefundLogModel.findAll({
        where: {
          refundStatus: {
            [Op.ne]: 'COMPLETED' // Not equal to 'COMPLETED'
          }
        }
      });
  
      if (refunds.length > 0) {
        // Get Monify authentication token
        const authToken = await this.getAuthTokenMonify();
        if (!authToken) return;
  
        // Check and update each refund
        for (const refund of refunds) {
          const refundStatus = await this.getRefundTransactionStatus(refund.refundTransactionReference);
  
          if (refundStatus) {
            await this.processRefund(refundStatus);
          }
        }
      } 
    } catch (error) {
      console.error('Error during refund status check:', error.message);
    }
  }
  

  async handleUploadPicture(data,file) {
    

   const{ userId }=await authUtil.verifyHandleUploadPicture.validateAsync(data);
 
   const user = await this.UserModel.findByPk(userId);

   if (!user) throw new NotFoundError("User not found.");

      try { 
        let accessPath=''

        if(serverConfig.NODE_ENV == "production"){
          accessPath =
          serverConfig.DOMAIN +
          file.path.replace("/home", "");
        }
        else if(serverConfig.NODE_ENV == "development"){

          accessPath = serverConfig.DOMAIN+file.path.replace("public", "");
        }
        await user.update({ image: accessPath ,
                        isImageVerified:true});

        return user
      } catch (error) {
        throw new ServerError("Failed to update user image" );
      }
  }

  
  async handleLoginAdmin(data) {

    const{ emailOrTel, password }=await authUtil.verifyHandleLoginAdmin.validateAsync(data);

    const isEmail = /\S+@\S+\.\S+/.test(emailOrTel);

    const user =  await this.AdminModel.findOne({
      where: {
        [Op.and]: [
          {
            [isEmail ? 'emailAddress' : 'tel']: emailOrTel
          },
          { [isEmail ? 'isEmailValid' : 'isTelValid']: true},
          { isDeleted: false}
          
        ],       
      },
    });   

    if (!user) throw new NotFoundError("User not found.");

    if (!(await bcrypt.compare(password, user.password))) return null;
    
    if(user.disableAccount) return 'disabled'

    return user;
  }


  async handleUpdateTel(data) {
    let {      
      userId,  
      tel,
    } = await authUtil.verifyHandleUpdateTel.validateAsync(data);

    try {
      
      let result =await this.UserModel.findByPk(userId)
      result.update(
        {
          tel:tel
        }
      );

    } catch (error) {
      console.log(error)
      throw new SystemError(error.name, error.parent)
    }

   
    

  }


  async handleLoginUser(data) {

    const { 
      emailAddress,
      password ,
      type
      }=await authUtil.verifyHandleLoginUser.validateAsync(data);

    let user 

    if(type=="list"){

      user =  await this.PropertyManagerModel.findOne({
        where: {
          emailAddress, 
          isEmailValid:true, 
          isDeleted:false
        }
      });  

    }
    else if(type=="rent") {
      user =  await this.ProspectiveTenantModel.findOne({
        where: {
          emailAddress, 
          isEmailValid:true,
          isDeleted:false
        }
      });  
    }
    else{
      user =  await this.AdminModel.findOne({
        where: {
          emailAddress, 
          isEmailValid:true,
          isDeleted:false
        }
      });  
    }
    
    if (!user) throw new NotFoundError("User not found.");


    if (!(await bcrypt.compare(password, user.password))) return null;
   
    if(user.disableAccount) return 'disabled'
    
    return user;
  }

  async generateToken(user) {

    try {
      const token = jwt.sign(user, serverConfig.TOKEN_SECRET, {
        algorithm: "HS256",
        expiresIn:serverConfig.TOKEN_EXPIRES_IN,
        issuer: serverConfig.TOKEN_ISSUER,
      });

      return token;
    } catch (error) {
      return error;
    }
  }


  
  async handleVerifyEmailorTelAdmin(data) {

    let { 
      userId,
      verificationCode,
      who,
      type
    } = await authUtil.verifyHandleVerifyEmailorTelAdmin.validateAsync(data);



    let relatedEmailoRTelValidationCode = ''


    if(who=='business'){
      relatedEmailoRTelValidationCode = await this.EmailandTelValidationBusinessModel.findOne({
        where: {
          userId: userId,
          verificationCode: verificationCode,
          type
        },
      })
    }
    else if(who=='admin'){
      relatedEmailoRTelValidationCode = await this.EmailandTelValidationAdminModel.findOne({
        where: {
          userId: userId,
          verificationCode: verificationCode,
          type
        },
      })
    }
    else if(who=='businessSpot'){
      relatedEmailoRTelValidationCode = await this.EmailandTelValidationBusinessSpotModel.findOne({
        where: {
          userId: userId,
          verificationCode: verificationCode,
          type
        },
      })
    }    


    if (relatedEmailoRTelValidationCode == null){
      throw new NotFoundError("Invalid verification code");
    } 
  

    var relatedUser = await this.AdminModel.findOne({
      where: { id: relatedEmailoRTelValidationCode.userId },
    });


    if (relatedUser == null){
      throw new NotFoundError("Selected user cannot be found");
    }
    try {
     
      if('email'){
        relatedUser.update({
          isEmailValid: true,
        });

        relatedEmailoRTelValidationCode.update({
          expiresIn: new Date(),
        });
      }
      else{
        relatedUser.update({
          isTelValid: true,
        });
      }
  
    } catch (error) {
      throw new ServerError("Failed to update "+type );
    }

  }
*/

  async handleVerifyEmailorTel(data) {

    let { 
      userId,
      verificationCode,
      validateFor,
      type
    } = await authUtil.verifyHandleVerifyEmailorTel.validateAsync(data);

    let relatedEmailoRTelValidationCode = await this.EmailandTelValidationModel.findOne({
      where: {
        userId: userId,
        validateFor,
        verificationCode: verificationCode,
        type
      },
    })  
    
    if (relatedEmailoRTelValidationCode == null){
      throw new NotFoundError("Invalid verification code");
    } 
    else if (relatedEmailoRTelValidationCode.expiresIn.getTime() < new Date().getTime()){
      throw new NotFoundError("verification code expired");
    }

    let relatedUser

    if(validateFor=='user'){

      relatedUser = await this.UserModel.findOne({
        where: { id: relatedEmailoRTelValidationCode.userId },
      });
    }
    else if(validateFor=='rent'){
      /*relatedUser = await this.ProspectiveTenantModel.findOne({
        where: { id: relatedEmailoRTelValidationCode.userId },
      });*/
    }
    else{
      /*
      relatedUser = await this.AdminModel.findOne({
        where: { id: relatedEmailoRTelValidationCode.userId },
      });
      */
    }
   

    if (relatedUser == null){
      throw new NotFoundError("Selected user cannot be found");
    }

    try {
     
      if(type==='email'){

        relatedUser.update({
          isEmailValid: true,
        });

        relatedEmailoRTelValidationCode.update({
          expiresIn: new Date(),
        });

        return  relatedUser
        
      }
      else{
        relatedUser.update({
          isTelValid: true,
        });

        return  relatedUser

      }
      

    } catch (error) {
      throw new ServerError("Failed to update "+type );
    }

  }


/*

  async  isUserEmailExisting(emailAddress,Model) {


    try {

      const existingUser = await Model.findOne({
        where: {
            emailAddress: emailAddress,
            isDeleted: false 
        }
      });

      if (existingUser) {

        return 'User with this email already exists.';
            
      } 
      return null

  }catch (error) {
      console.log(error)
      throw new SystemError(error.name, error.parent)
    }
      
  }


  async  sendEmailVerificationCode(emailAddress, userId, validateFor) {

  try {
    
      var keyExpirationMillisecondsFromEpoch = new Date().getTime() + 30 * 60 * 1000;
      const verificationCode = Math.floor(Math.random() * 900000) + 100000;

      await this.EmailandTelValidationModel.upsert({
        userId,
        type: 'email',
        validateFor,
        verificationCode,
        expiresIn: new Date(keyExpirationMillisecondsFromEpoch),
      }, {
        where: {
          userId,
          validateFor
        }
      });
  
      try {
            
          await mailService.sendMail({
            to: emailAddress,
            subject:"Account Verification",
            templateName:"emailVerificationCode",
            variables: {
              verificationCode:verificationCode,
              email: emailAddress,
            },
          })
  
      } catch (error) {
          console.log(error)
      }
  
  
  } catch (error) {
    console.log(error);
  }

   



  }

  /*
  async  sendTelVerificationCode(tel, userId) {


    try {
      
        var keyExpirationMillisecondsFromEpoch = new Date().getTime() + 30 * 60 * 1000;
        const verificationCode = Math.floor(Math.random() * 900000) + 100000;
  
  
        await this.EmailandTelValidationModel.upsert({
          userId,
          type: 'tel',
          verificationCode,
          expiresIn: new Date(keyExpirationMillisecondsFromEpoch),
        }, {
          where: {
            userId
          }
        });
    
        try {
              
          const options = {
            method: 'GET',
            url: 'https://phonenumbervalidatefree.p.rapidapi.com/ts_PhoneNumberValidateTest.jsp',
            params: {
              number: '+2348184724615',
            },
            headers: {
              'X-RapidAPI-Key': 'b03b577e45mshb62f4d5ecbfae57p108324jsna07cb1377bb8',
              'X-RapidAPI-Host': 'phonenumbervalidatefree.p.rapidapi.com'
            }
          };
          
          try {
            const response = await axios.request(options);
            console.log(response.data);
          } catch (error) {
            console.error(error);
          }
    
        } catch (error) {
            console.log(error)
        }
    
    
    } catch (error) {
      console.log(error);
    }
  
     
  
  
  
  }


  async  sendTextVerificationCode(emailAddress, userId) {

    try {      
        var keyExpirationMillisecondsFromEpoch = new Date().getTime() + 30 * 60 * 1000;
        const verificationCode  = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');


        await this.EmailandTelValidationModel.upsert({
          userId,
          type: 'email',
          verificationCode,
          expiresIn: new Date(keyExpirationMillisecondsFromEpoch),
        }, {
          where: {
            userId
          }
        });

        
    
        try {
              
            await mailService.sendMail({
              to: emailAddress,
              subject: "Account Verification",
              templateName: "emailVerificationCode",
              variables: {
                verificationCode:verificationCode,
                email: emailAddress,
              },
            });
    
        } catch (error) {
            console.log(error)
        }
    
    
    } catch (error) {
      console.log(error);
    }
  
  
  }
  
  async cronJobToUpdateDisbursement() {
    try {
      const transactions = await this.TransactionModel.findAll({
        where: {
          transactionType: ['fistRent', 'commission', 'rent'],
          paymentStatus: ['PENDING', 'unverified']
        }
      });
  
      if (transactions.length === 0) {
        console.log("No pending or unverified transactions found.");
        return;
      }
  
      for (const transaction of transactions) {
        try {
          // Fetch transaction status from the disbursement API
          const transactionStatus = await this.getTransactionStatusDisbursement(transaction.paymentReference);
  
          // Process the disbursement status
          await this.handleDisbursement(transactionStatus);
  
          // Update the transaction status if necessary
         /* if (transactionStatus.paymentStatus !== transaction.paymentStatus) {
            await transaction.update({
              paymentStatus: transactionStatus.paymentStatus
            });
            console.log(`Transaction ${transaction.id} updated to ${transactionStatus.paymentStatus}`);
          }*/

            /*
  
        } catch (error) {
          console.error(`Error processing transaction ${transaction.id}:`, error);
        }
      }
    } catch (error) {
      console.error("Error running cron job for disbursement:", error);
    }
  }
  


  async cronJobToUpdateDueRent(){
    try {
      // Get current date
      const currentDate = new Date();
  
      // Find tenants whose status is not 'terminated' and rentNextDueDate is not null
      const tenants = await this.TenantModel.findAll({
        where: {
          status: {
            [Op.ne]: 'terminated', // Not terminated tenants
          },
          isDeleted: false, // Exclude deleted tenants if applicable
        },
      });
  
      // Loop through the tenants and check if rent is due
      for (let tenant of tenants) {
        if (tenant.rentNextDueDate <= currentDate) {
          // Update the status to 'rentDue' if rentNextDueDate is in the past
          tenant.status = 'rentDue';
          await tenant.save(); // Save the changes
        }
      }
  
    } catch (error) {
      console.error('Error updating rent status:', error);
    }
  }

  /*ADD THE BELOW TO CRON JOB */
  //checkRefundUpdate
  //cronJobToUpdateDueRent
  //cronJobToUpdateDisbursement
  
}

export default new AuthenticationService();
