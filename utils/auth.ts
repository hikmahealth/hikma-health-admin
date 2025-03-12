const HIKMA_API = process.env.NEXT_PUBLIC_HIKMA_API;

// Call is_authenticated endpoint to check if user is authenticated
export const isAuthenticated = async (token: string) => {
  const response = await fetch(`${HIKMA_API}/admin_api/is_authenticated`, {
    method: 'GET',
    headers: {
      Authorization: token,
    },
  });
  const status = response.status === 200 ? true : false;
  const data = (await response.json()).message === 'ok' ? true : false;
  return data && status;
};
