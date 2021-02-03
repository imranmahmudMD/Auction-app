import AWS from 'aws-sdk'; // imports the AWS sdk - you can see is in the package.json
import commonMiddleware from '../lib/commonMiddleware';
import createError from 'http-errors'; // allows us to create http error in very declarative way
import { getAuctionById } from './getAuction';
import validator from '@middy/validator';
import placeBidSchema from '../lib/schemas/placeBidSchema';

const dynamodb = new AWS.DynamoDB.DocumentClient(); // have specified this outside of function so dont have to create for every execution (out of scope/global scope)

async function placeBid(event, context) {
  const { id } = event.pathParameters;
  const { amount } = event.body;
  const { email } = event.requestContext.authorizer;

  const auction = await getAuctionById(id);
// Auction status validation
  if (auction.status !== 'OPEN'){
      throw new createError.Forbidden('You cannot bid on closed auctions!');
  }
// Auction amount validations
  if(amount <= auction.highestBid.amount) {
      throw new createError.Forbidden('Your bid must be higher than ${auction.highestBid.amount}!');
  }
  // Avoid double bidding
  if(email === auction.highestBid.bidder) {
      throw new createError.Forbidden('You are already the highest bidder');
  }
  // Avoid seller bidding on own auction
  if(auction.seller === email) {
      throw new createError.Forbidden('You cannot bid on your own auction');
  }
  const params = {
      TableName: process.env.AUCTIONS_TABLE_NAME,
      Key: { id },
      UpdateExpression: 'set highestBid.amount = :amount, highestBid.bidder = :bidder', // this is an expression language supported by dynamoDB
      ExpressionAttributeValues: {
          ':amount': amount,
          ':bidder': email,
      },
      ReturnValues: 'ALL_NEW',
  };
  let updatedAuction;
  try{
    const result = await dynamodb.update(params).promise();
    updatedAuction = result.Attributes;
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }
  return {
    statusCode: 200,
    body: JSON.stringify(updatedAuction),
  };
}


export const handler = commonMiddleware(placeBid)
  .use(validator({ inputSchema: placeBidSchema }));