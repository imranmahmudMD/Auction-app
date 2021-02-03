import { v4 as uuid} from 'uuid';
import AWS from 'aws-sdk'; // imports the AWS sdk - you can see is in the package.json
import commonMiddleware from '../lib/commonMiddleware';
import createError from 'http-errors'; // allows us to create http error in very declarative way
import validator from '@middy/validator';
import createAuctionSchema from '../lib/schemas/createAuctionSchema';


const dynamodb = new AWS.DynamoDB.DocumentClient(); // have specified this outside of function so dont have to create for every execution (out of scope/global scope)

async function createAuction(event, context) {
  const {title} = event.body; // this will take event body that is stringified, parse into object and store in the variabel
  const now = new Date();
  const { email } = event.requestContext.authorizer;
  const endDate = new Date();
  endDate.setHours(now.getHours() +1);// auction end date is 1 hour from now

  const auction = {
    id: uuid(), // here we call the uuid function which will generate the uuid
    title, // can notate it like so as it has been declared as a value above in curly brackets
    status: 'OPEN',
    createdAt: now.toISOString(), // ISOString is a standard way to store date in a DB
    endingAt: endDate.toISOString(),
    highestBid: {
      amount: 0, //default value
    },
    seller: email,
  };

  try{
    await dynamodb.put({
      TableName: process.env.AUCTIONS_TABLE_NAME,
      Item: auction,
    }).promise();
  } catch(error) {
    console.error(error);
    throw new createError.InternalServerError(error); // instead of ISE - can use NotFound or Unauthorized
  }


  return {
    statusCode: 201,
    body: JSON.stringify(auction),
  };
}
// status code 200 is HTTP for "success/OK. Alwyas stringify the response body of the lambda
export const handler = commonMiddleware(createAuction)
  .use(validator({ inputSchema: createAuctionSchema}));
