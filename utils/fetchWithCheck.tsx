
export async function fetchWithCheck<T = any>(
    input: RequestInfo,
    init?: RequestInit
  ): Promise<T> {
    const res = await fetch(input, init);
  
    let json: any;
    try {
      json = await res.json();
    } catch (e) {
      throw new Error("Invalid JSON response");
    }
  
    if (!json.success) {
      throw new Error(json.message);
    }
  
    return json.data;
  }