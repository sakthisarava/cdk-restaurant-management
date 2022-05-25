import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as ddb from '@aws-cdk/aws-dynamodb';
import * as apigateway from '@aws-cdk/aws-apigateway';
import {
  CognitoToApiGatewayToLambda
} from '@aws-solutions-constructs/aws-cognito-apigateway-lambda';
import {
  LambdaToDynamoDB
} from '@aws-solutions-constructs/aws-lambda-dynamodb';

// Properties for the service-staff-stack
export interface ServiceStaffStackProps {
  // The main database created in the shared-stack
  readonly db: ddb.Table,
}

// Stack
export class ServiceStaffStack extends cdk.Stack {
  
  // Constructor
  constructor(scope: cdk.Construct, id: string, props: ServiceStaffStackProps) {
    super(scope, id);

    // Create a Lambda function that adds a new order to the database
    const createOrder = new LambdaToDynamoDB(this, 'create-order', {
      lambdaFunctionProps: {
        runtime: lambda.Runtime.NODEJS_14_X,
        code: lambda.Code.fromAsset(`${__dirname}/lambda/service-staff/create-order`),
        handler: 'index.handler',
        timeout: cdk.Duration.seconds(15)
      },
      existingTableObj: props.db
    });

    // Create a Lambda function that closes out an order in the table
    const processPayment = new LambdaToDynamoDB(this, 'process-payment', {
      lambdaFunctionProps: {
        runtime: lambda.Runtime.NODEJS_14_X,
        code: lambda.Code.fromAsset(`${__dirname}/lambda/service-staff/process-payment`),
        handler: 'index.handler',
        timeout: cdk.Duration.seconds(15)
      },
      existingTableObj: props.db
    });

    // Setup the service staff API with Cognito user pool
    const serviceStaffApi = new CognitoToApiGatewayToLambda(this, 'service-staff-api', {
    	existingLambdaObj: createOrder.lambdaFunction,
		  apiGatewayProps: {
	      proxy: false,
        description: 'Demo: Service staff API'
	    }
    });
    
    // Add a resource to the API for creating a new order
    const createOrderResource = serviceStaffApi.apiGateway.root.addResource('create-order');
    createOrderResource.addProxy({
    	defaultIntegration: new apigateway.LambdaIntegration(serviceStaffApi.lambdaFunction),
    	anyMethod: true
    });
    
    // Add a resource to the API for handling payments and marking orders as paid
    const processPaymentResource = serviceStaffApi.apiGateway.root.addResource('process-payment');
    processPaymentResource.addProxy({
    	defaultIntegration: new apigateway.LambdaIntegration(processPayment.lambdaFunction),
    	anyMethod: true
    });
    
    // Add the authorizers to the API
    serviceStaffApi.addAuthorizers();
  }
}