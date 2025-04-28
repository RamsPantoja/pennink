export async function GET(req: Request) {
	try {
		return Response.json({
			code: 200,
			message: "OK",
		});
	} catch (error) {
		console.log({ error });
		return Response.json({
			code: 500,
			message: "Something went wrong generating the response",
		});
	}
}
