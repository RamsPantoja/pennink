import Head from "next/head";
import { SharedContentLayout } from "~/layout/SharedContent";

const SharedEditor = () => {
	return (
		<SharedContentLayout>
			<>
				<Head>
					<title>Pennink - Workspace</title>
					<meta name="description" content="Find a partner to do anything!" />
					<link rel="icon" href="/icon.png" />
				</Head>
				### The origin This idea was born because we met manufacturers and
				brands that have been tracking their manufacturing processes with
				spreadsheets and Monday tables. And we realized the limitations and
				inefficiencies of using manual tracking methods, so, we think that can
				exist a better solutions that really fits the manufacturing industry. So
				that is why we decide to build Made In to change the way manufacturers
				and brands manage their production processes, making it more efficient
				and streamlined. ### Innovation In one side, we got a smart monitor that
				uses artificial intelligence, RAG techniques and agents to detect and
				analyze various aspects of the manufacturing process in real time, such
				as product quality. And in the other side, we got a marketplace feature
				that uses a recommendation system with a vector database and llm to
				generate the vector representation of the requested products and
				manufacturers, allowing matching between manufacturers and customers.
				And each side complements each other. ### Infra and scalability All our
				product and services are in AWS, we use services like: * Storage * Web
				hosting * AI services like llms * Firewall * Load balancers So we are
				prepared for high demand and scalability if it was needed. ###
				Technologies We are using the following technologies: * NextJS for UI *
				MongoDB for common data storage * SQLite for vector storage * Typescript
				* GraphQL for query data * NodeJS for backend * GPT-OSS model for
				fine-tuning and agent tools ### Roadmap * Improve the AI model with
				manufacturers data * Extend our database for manufacturers using we
				scraper tools * Implement a AI model for computer vision trained with
				manufacturers data
			</>
		</SharedContentLayout>
	);
};

export default SharedEditor;
