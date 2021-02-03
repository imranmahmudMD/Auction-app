import AWS from 'aws-sdk'; // imports the AWS sdk - you can see is in the package.json
import commonMiddleware from '../lib/commonMiddleware';
import createError from 'http-errors'; // allows us to create http error in very declarative way

const dynamodb = new AWS.DynamoDB.DocumentClient(); // have specified this outside of function so dont have to create for every execution (out of scope/global scope)

export async function getAuctionById(id){
    let auction;

    try{
        const result = await dynamodb.get({
            TableName: process.env.AUCTIONS_TABLE_NAME,
            Key: { id }, // this is an ES6 syntax which is the same as id: id
        }).promise();
        auction = result.Item;
      } catch (error) {
        console.error(error);
        throw new createError.InternalServerError(error);
      }
      if (!auction) { // if auction is falsy
        throw new createError.NotFound('Auction with ID "${id}" not found!');
      }
      return auction;
}

async function getAuction(event, context) {
  const { id } = event.pathParameters; // create id variable that should contain the path parameter
  const auction = await getAuctionById(id);
  return {
    statusCode: 200,
    body: JSON.stringify(auction),
  };
}


export const handler = commonMiddleware(getAuction);
