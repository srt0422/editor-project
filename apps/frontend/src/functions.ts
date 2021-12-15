import { ApolloClient, InMemoryCache, useQuery, gql } from "@apollo/client";
import { INote } from "../../../interfaces";

const client = new ApolloClient({
  // uri: "http://localhost:3001/graphql",
  cache: new InMemoryCache(),
});

export async function getNotes(): Promise<INote[]> {
  try {
    const { data, error, errors } = await client.query({
      query: gql`
        query Notes {
          notes {
            id
            title
            content
          }
        }
      `,
    });

    if (error) {
      console.log("error: ", error);
    }

    if (errors) {
      console.log("errors: ", errors);
    }

    return data.notes;
  } catch (e) {
    console.log("failed fetching notes: ", e);
  }

  return [];
}
