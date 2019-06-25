let aws = require('aws-sdk');

//
//	Create a Lambda object for invocation
//
let lambda = new aws.Lambda({
	region: process.env.AWS_REGION
});

//
//	This function is responsabile for getting all the information from the
//	phone conversation and create a email out of all of this.
//
exports.handler = (event, context, callback) => {

	//
	//	<>> Log for now since there is a bit more work ahead
	//
    console.log(JSON.stringify(event, null, 4));

    //
    //	1.	Get all the data from the flow and save it in clear variables
    //
    let name = event.Details.ContactData.Attributes.first_name;
    let phone_nr = event.Details.ContactData.CustomerEndpoint.Address;
    let message = event.Details.ContactData.Attributes.Message;

    //
    //	2.	Use an array to create the body of the email so we can easlly
    //		do chagnes and work with the txt, without some vierd string
    //		concatenation.
	//
	//		This approach is much more easy to manage and mantain
    //
    let body = [
        "Hi David,",
        "\n\n",
        "You have a new message from " + name,
        "\n\n",
        "The message goes like this: " + message,
        "\n\n",
        "You can call back with this phone Nr.: " + phone_nr,
        "\n\n",
        "Take care."
    ];

    //
    //	3.	Create the email based on all the data that we colected.
    //
    let email = {
    	from	: '"0x4447 HQ" <hq@0x4447.email>',
    	to		: '"David Gatti" <david@0x4447.com>',
    	subject	: "You have a new Voice Message",
    	reply_to: "null@0x4447.email",
    	html	: '',
    	text	: body.join('') 	|| ''
    };

	//
	//	4.	Prepare the Lambda Invocation with all the data that needs to be
	//		passed to the Lambda to sucesfully send the email.
	//
	var params = {
		FunctionName: 'Toolbox_Send_Email',
		Payload: JSON.stringify(email, null, 2),
	};

	//
	//	5.	Invoke the Lambda Function
	//
	lambda.invoke(params, function(error, data) {

		//
		//	1.	Check if there was an error in invoking the fnction
		//
		if(error)
		{
			callback(error);
		}

		//
		//	2.	Convert the payload to JS
		//
		let response = JSON.parse(data.Payload);

		//
		//	3.	Check if there was an error
		//
		if(response.errorMessage)
		{
			//
			//	->	Stop here and surface the error
			//
			callback(response.errorMessage);
		}

		//
		//	->	Move to the next chain
		//
	    callback(null, {});

	});

};