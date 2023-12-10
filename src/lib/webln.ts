import {
	requestProvider,
	MissingProviderError,
	RejectionError,
	ConnectionError,
	InternalError,
	InvalidDataError,
	RoutingError,
	UnsupportedMethodError
} from 'webln';

// https://www.webln.dev/client/errors
const errorMessages = {
	MissingProviderError: `You need the WebLN wallet. See https://www.webln.dev/`,
	RejectionError: ``,
	ConnectionError: `Failed to connect between your node and our node.`,
	UnsupportedMethodError: ``,
	RoutingError: `No route. Please add your node as a peer, or open a channel`,
	InvalidDataError: `Invoice may be wrong.`,
	InternalError: ``
};

export async function openPayment(invoice: string) {
	try {
		const webln = await requestProvider();
		const result = await webln.sendPayment(invoice);
		// Example of Alby. But don't assume this. https://www.webln.dev/ux-best-practices
		// {
		//   preimage: '65d4b7d765171e601e5e1e6c0c4d544233ca3d4414fd2d4c1d84d08e5cc5e7dd',
		//   paymentHash: '41dcbc16d421f66ddbb7bf64e438b21f1ee803e9607e94d6f4d90a86ac997050',
		//   route: { total_amt: '1', total_fees: '0' }
		// }
		console.log('succeeded payment: ', result);

		return result.preimage;
	} catch (err) {
		// note: thease messages are Alby's implementation
		// Because `RejectionError`, etc. doesn't work currently.
		if (err.message === 'Your browser has no WebLN provider') {
			alert(errorMessages.MissingProviderError);
			return;
		} else if (
			err.message ===
			'webln.enable() failed (rejecting further window.webln calls until the next reload)'
		) {
			alert(`You rejected once. Reload again.`);
			return;
		} else if (err.message === 'User rejected') {
			// Do nothing, because the user rejected to pay.
			return;
		} else if (err.message === 'invoice is already paid' || err.message === 'Prompt was closed') {
			// Do nothing, because it assume that prompt has already displayed from wallet.
			return;
		}

		// Along with WebLN's spec
		if (err.constructor === MissingProviderError) {
			return;
		} else if (err.constructor === RejectionError) {
			// Do nothing, because the user rejected to pay.
			return;
		} else if (err.constructor === ConnectionError) {
			alert(errorMessages.ConnectionError);
			return;
		} else if (err.constructor === RoutingError) {
			alert(errorMessages.RoutingError);
			return;
		} else if (err.constructor === InvalidDataError) {
			alert(errorMessages.InvalidDataError);
			return;
		} else if (err.constructor === UnsupportedMethodError || err.constructor === InternalError) {
			// Pass to default message
		}

		console.error(err);
		alert(err.message);
	}
}
