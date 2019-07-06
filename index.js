let AWS = require('aws-sdk');

//
//  Create the DynamoDB object.
//
let ddb = new AWS.DynamoDB.DocumentClient({
    apiVersion: '2012-08-10',
    region: process.env.AWS_REGION
});

//
//  Create the Simple Notification System object.
//
let sns = new AWS.SNS({
    apiVersion: '2010-03-31'
});

//
//  This function will be triggered by connect with all the details of the
//  conversation, so in this case we can save the message left and send
//  it to SNS.
//
exports.handler = (event) => {

    return new Promise(function(resolve, reject) {

        //
        //  1.  Create a container to pass around the promises.
        //
        let container = {
            //
            //  Organize all the data that we get so we know what
            //  this code uses.
            //
            req: {
                phone_nr: event.Details.ContactData.CustomerEndpoint.Address,
                message: event.Details.ContactData.Attributes.Message,
                name: event.Details.ContactData.Attributes.first_name
            },
            //
            //  The message to be sent.
            //
            message: "",
            //
            //  Hold the response for Connect.
            //
            res: 'OK'
        }

        //
        //  ->  Start the chain.
        //
        save_the_message(container)
            .then(function(container) {

                return create_the_message(container);

            }).then(function(container) {

                return send_the_message(container);

            }).then(function(container) {

                return resolve(container.res);

            }).catch(function(error) {

                return reject(error);

            });

    });

};

//   _____    _____     ____    __  __   _____    _____   ______    _____
//  |  __ \  |  __ \   / __ \  |  \/  | |_   _|  / ____| |  ____|  / ____|
//  | |__) | | |__) | | |  | | | \  / |   | |   | (___   | |__    | (___
//  |  ___/  |  _  /  | |  | | | |\/| |   | |    \___ \  |  __|    \___ \
//  | |      | | \ \  | |__| | | |  | |  _| |_   ____) | | |____   ____) |
//  |_|      |_|  \_\  \____/  |_|  |_| |_____| |_____/  |______| |_____/
//

//
//  This lambda saves the name that the user over the phone said.
//
function save_the_message(container) {

    return new Promise(function(resolve, reject) {

        console.info('save_the_message');

        //
        //  1.  Get the actual time, to organize our data in DDB.
        //
        let timestamp = Math.floor(Date.now() / 1000);

        //
        //  2.  Prepare the query.
        //
        let params = {
            TableName: "0x4447_connect_sessions",
            Item: {
                id: container.req.phone_nr,
                type: 'message#' + timestamp,
                message: container.req.message,
                timestamp_created: timestamp
            },
        };

        //
        //  3.  Execute the query
        //
        ddb.put(params, function(error, data) {

            //
            //  1.  Check if there were any errors.
            //
            if(error)
            {
                console.info(params);
                return reject(error);
            }

            //
            //  ->  Move to the next Promise.
            //
            return resolve(container);

        });

    });
};

function create_the_message(container) {

    return new Promise(function(resolve, reject) {

        console.info('create_the_message');

        //
        //  1.  Use an array to make a message since it is easier to work with.
        //
        let message = [
            "Greetings Human,", "\n",
            "\n",
            "You just got a new voice message, here are the details:", "\n",
            "\n",
            "- Name: " + container.req.name, "\n",
            "- Phone Nr.: " + container.req.phone_nr, "\n",
            "- Message: " + container.req.message, "\n",
            "\n",
            "Enjoy your existence."
        ]

        //
        //  2.  Combine the array in to a single string.
        //
        container.message = message.join('');

        //
        //  ->  Move to the next Promise.
        //
        return resolve(container);

    });

};

//
//  Send a message to whoever is interest to know that a new phone call happened.
//
function send_the_message(container) {

    return new Promise(function(resolve, reject) {

        console.info('send_the_message');

        //
        //  1.  Prepare the query.
        //
        let params = {
            Subject: 'New message on your voice mail.',
            Message: container.message,
            TopicArn: process.env.SNS_TOPIC
        };

        //
        //  ->  Execute the query.
        //
        sns.publish(params, function(error, data) {

            //
            //  1.  Check if there were any errors.
            //
            if(error)
            {
                console.info(params);
                return reject(error);
            }

            //
            //  ->  Move to the next Promise.
            //
            return resolve(container);

        });

    });

};