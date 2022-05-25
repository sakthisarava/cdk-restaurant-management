import * as cdk from '@aws-cdk/core';
import * as ddb from '@aws-cdk/aws-dynamodb';
import * as lambda from '@aws-cdk/aws-lambda';

// Stack
export class SharedStack extends cdk.Stack {

  // Public variables
  public readonly database: ddb.Table;
  public readonly layer: lambda.LayerVersion;

  // Constructor
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Setup the database ----------------------------------------------------------------------------------------------
    this.database = new ddb.Table(this, "order-table", {
      partitionKey: {
        name: "id",
        type: ddb.AttributeType.STRING,
      },
      billingMode: ddb.BillingMode.PROVISIONED,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // Add autoscaling
    const readScaling = this.database.autoScaleReadCapacity({
      minCapacity: 1,
      maxCapacity: 50,
    });

    readScaling.scaleOnUtilization({
      targetUtilizationPercent: 50,
    });

    // Add a global secondary index for query operations
    this.database.addGlobalSecondaryIndex({
      partitionKey: {
        name: "gsi1pk",
        type: ddb.AttributeType.STRING,
      },
      sortKey: {
        name: "gsi1sk",
        type: ddb.AttributeType.STRING,
      },
      indexName: "gsi1pk-gsi1sk-index",
    });

    // Setup a Lambda layer for sharing database functions -------------------------------------------------------------
    this.layer = new lambda.LayerVersion(this, 'shared-db-functions-layer', {
      code: lambda.Code.fromAsset(`${__dirname}/lambda/layer`),
      compatibleRuntimes: [ lambda.Runtime.NODEJS_14_X ],
      license: 'Apache-2.0',
      description: 'Layer for common database access functions',
    });
  }
}