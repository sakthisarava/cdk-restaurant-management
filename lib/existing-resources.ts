import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';

export class ExistingResources extends cdk.Stack {

  // Public variables
  public readonly archiveBucket: s3.Bucket;

  // Constructor
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // An "existing" Amazon S3 bucket that holds archived orders
    this.archiveBucket = new s3.Bucket(this, 'existing-order-archive-bucket');
  }
}