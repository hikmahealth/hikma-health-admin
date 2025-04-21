class HikmaHealth {
  private apiUrl: string;
  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  path(paths: string) {
    return `${this.apiUrl}${paths}`;
  }
}

export const hikma = () => {
  const url = process.env.NEXT_PUBLIC_HIKMA_API;
  if (typeof url !== 'string') {
    throw new Error('missing NEXT_PUBLIC_HIKMA_API configuration on the project instance');
  }

  return new HikmaHealth(url);
};
