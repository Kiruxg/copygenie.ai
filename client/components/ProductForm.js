import React, { useState } from "react";
import { useToast } from "../hooks/useToast";
import { generateDescription } from "../services/api";

const ProductForm = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    productName: "",
    features: "",
    tone: "professional", // default tone
    targetMarket: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page refresh

    try {
      setLoading(true);

      const response = await generateDescription({
        ...formData,
        features: formData.features.split("\n").filter((f) => f.trim()), // Convert to array
      });

      if (response.success) {
        showToast({
          type: "success",
          title: "Description Generated",
          message: "Your product description has been created successfully!",
        });

        // Handle the generated description (e.g., update parent component)
        if (typeof onDescriptionGenerated === "function") {
          onDescriptionGenerated(response.description);
        }
      } else {
        throw new Error(response.error || "Failed to generate description");
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Generation Failed",
        message:
          error.message || "Failed to generate description. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} id="productForm" className="space-y-6">
      <div>
        <label
          htmlFor="productName"
          className="block text-sm font-medium text-gray-700"
        >
          Product Name *
        </label>
        <input
          type="text"
          id="productName"
          name="productName"
          value={formData.productName}
          onChange={handleInputChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label
          htmlFor="features"
          className="block text-sm font-medium text-gray-700"
        >
          Key Features * (one per line)
        </label>
        <textarea
          id="features"
          name="features"
          value={formData.features}
          onChange={handleInputChange}
          required
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Enter key features, one per line"
        />
      </div>

      <div>
        <label
          htmlFor="tone"
          className="block text-sm font-medium text-gray-700"
        >
          Tone
        </label>
        <select
          id="tone"
          name="tone"
          value={formData.tone}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="professional">Professional</option>
          <option value="casual">Casual</option>
          <option value="enthusiastic">Enthusiastic</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="targetMarket"
          className="block text-sm font-medium text-gray-700"
        >
          Target Market
        </label>
        <input
          type="text"
          id="targetMarket"
          name="targetMarket"
          value={formData.targetMarket}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="e.g., Young professionals, Parents, etc."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Generating...
          </>
        ) : (
          "Generate Description"
        )}
      </button>
    </form>
  );
};

export default ProductForm;
