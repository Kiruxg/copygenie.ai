const API_BASE_URL = process.env.REACT_APP_API_URL || "/api";

export const generateDescription = async (productData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/descriptions/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Include auth token if you have authentication
        ...(localStorage.getItem("token") && {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        }),
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to generate description");
    }

    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

// Add other API methods as needed
export const getUserUsage = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/usage`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Usage API Error:", error);
    throw error;
  }
};
