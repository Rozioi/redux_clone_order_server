import { app } from "./app";
import { config } from "./config/env";
const port = config.PORT;

const start = async () => {
	try {
		await app.listen({ port });
		console.log(`Server running on PORT ${port}`);
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
};

start();
