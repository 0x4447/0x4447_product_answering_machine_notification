let aws = require('aws-sdk');

//
//  Create a Lambda object for invocation
//
let lambda = new aws.Lambda({
    region: process.env.AWS_REGION
});

//
//  This function is responsabile for getting all the information from the
//  phone conversation and create a email out of all of this.
//
exports.handler = (event) => {

    return new Promise(function(resolve, reject) {

        //
        //  1.  Get all the data from the flow and save it in clear variables.
        //
        let name = event.Details.ContactData.Attributes.first_name;
        let phone_nr = event.Details.ContactData.CustomerEndpoint.Address;
        let message = event.Details.ContactData.Attributes.Message;

        //
        //  2.  Check if we got a message, and if not set a default one.
        //
        if(!message)
        {
            message = "No message left.";
        }

        //
        //  3.  Use an array to create the body of the email so we can easily
        //      do changes and work with the txt.
        //
        //      This approach is much more easy to manage and maintain.
        //
        let body = [
            "Hi,",
            "\n\r\n\r",
            "You have a new message from " + name,
            "\n\r\n\r",
            "The message goes like this: " + message,
            "\n\r\n\r",
            "You can call back with this phone Nr.: " + phone_nr,
            "\n\r\n\r",
            "Take care."
        ];

        //
        //  4.  Create the email based on all the data that we colected.
        //
        let email = {
            from    : process.env.FROM,
            to      : process.env.TO,
            reply_to: process.env.REPLY_TO,
            subject : "You have a new Voice Message",
            text    : body.join('') || ''
        };

        //
        //  5.  Prepare the Lambda Invocation with all the data that needs to be
        //      passed to the Lambda to sucesfully send the email.
        //
        let params = {
            FunctionName: 'Toolbox_Send_Email',
            Payload: JSON.stringify(email, null, 2),
        };

        //
        //  6.  Invoke the Lambda Function
        //
        lambda.invoke(params, function(error, data) {

            //
            //  1.  Check if there was an error in invoking the fnction
            //
            if(error)
            {
                console.info(params);
                return reject(error);
            }

            //
            //  2.  Convert the payload to JS
            //
            let response = JSON.parse(data.Payload);

            //
            //  3.  Check if there was an error
            //
            if(response.errorMessage)
            {
                //
                //  ->  Stop here and surface the error
                //
                console.info(params);
                return reject(new Error(response.errorMessage));
            }

            //
            //  ->  Tell Lambda that we are done working.
            //
            return resolve({});

        });

    });

};