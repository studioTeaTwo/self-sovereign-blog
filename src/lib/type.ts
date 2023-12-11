export type PostSummary = {
	slug: string;
	isIndexFile: boolean;
	title: string;
	date: string;
	preview: { html: string; text: string };
	readingTime: string;
	paywall: {
		hasPaywallContent: boolean;
		price: number;
		wordCount: number;
	};
	[key: string]: unknown;
};

// transit from left to right sequencially
export type PaywallStatus =
	| 'NEED_NOSTR'
	| 'NEED_INVOICE'
	| 'NEED_PAYMENT'
	| 'NEED_VERIFIED'
	| 'VERIFIED_OR_NON_PAYWALLCONTENT';

export type PurchaseHistory = {
	eventId: string; // Nostr event id
	slug: string; // from DM content
	price: number; // from DM content
	paidAmount: number; // from DM content
	preimage: string; // from DM content
	macaroon: string; // from DM tag
	purchasedDate: string; // from DM content
	createdAt: number; // from Nostr event
};

export type SsrApiResponse = {
	status: PaywallStatus;
	reason?: string;
	html?: string;
	invoice?: string;
};

// ref: github.com/studioTeaTwo/simple-l402-server/l402.go
export type L402ApiResponse = {
	result: boolean;
	reason: string;
};

export type L402Cookie = {
	macaroon: string;
	invoice: string;
	preimage: string;
	count: number;
};
