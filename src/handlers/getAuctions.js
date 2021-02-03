import AWS from 'aws-sdk'; // imports the AWS sdk - you can see is in the package.json
import commonMiddleware from '../lib/commonMiddleware';
import createError from 'http-errors'; // allows us to create http error in very declarative way

const dynamodb = new AWS.DynamoDB.DocumentClient(); // have specified this outside of function so dont have to create for every execution (out of scope/global scope)

async function getAuctions(event, context) {
    const { status } = event.queryStringParameters;
    let auctions;
    const params = {
        TableName: process.env.AUCTIONS_TABLE_NAME,
        IndexName: 'statusAndEndDate',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeValues: {
          ':status': status,
        },
        ExpressionAttributeNames: {
          '#status': 'status',
        },
      };
      try {
        const result = await dynamodb.query(params).promise();

        auctions = result.Items; // perform the scan, assign the item to auction and then return that below
      } catch (error) {
        console.error(error);
        throw new createError.InternalServerError(error); // don't expose internal errors to users as a best practice!
    }

  return {
    statusCode: 200,
    body: JSON.stringify(auctions),
  };
}


export const handler = commonMiddleware(getAuctions); //wrap function with middleware