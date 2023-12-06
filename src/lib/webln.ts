import { requestProvider } from 'webln';

export async function openPayment(invoice: string) {
	try {
		const webln = await requestProvider();
		const result = await webln.sendPayment(invoice);
		// example alby
		// {
		//   preimage: '65d4b7d765171e601e5e1e6c0c4d544233ca3d4414fd2d4c1d84d08e5cc5e7dd',
		//   paymentHash: '41dcbc16d421f66ddbb7bf64e438b21f1ee803e9607e94d6f4d90a86ac997050',
		//   route: { total_amt: '1', total_fees: '0' }
		// }
		console.log('succeeded payment: ', result);

		return result.preimage;
	} catch (err) {
		switch (err.message) {
			case 'Your browser has no WebLN provider':
				alert(`You need the WebLN wallet. See https://www.webln.dev/`);
				break;
			case 'webln.enable() failed (rejecting further window.webln calls until the next reload)':
				alert(`You rejected once. Reload again.`);
				break;
			case 'User rejected':
				// Do nothing, because the user rejected to pay.
				break;
			case 'invoice is already paid':
			case 'Prompt was closed':
				// Do nothing, because it assume that prompt has already displayed from wallet.
				break;
			default:
				console.error(err);
				alert(err.message);
		}
	}
}
