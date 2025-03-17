
export default async (req) => {
    // forward the request straight to the are.na gql API
    const fetch_endpoint='https://api.are.na/graphql';
    const token=process.env.ARENA_GQL;

    const response = await fetch(fetch_endpoint, {
        method: req.method,
        headers: {
            'Content-Type': 'application/json',
            'X-APP-TOKEN':token
        },
        body: req.body,
        duplex: "half"
      });

    const data = await response.json();
    console.log(data);

    return new Response(
        JSON.stringify(data),
        {
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
};

