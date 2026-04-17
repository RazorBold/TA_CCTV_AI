# 1. Import the library
from inference_sdk import InferenceHTTPClient

# 2. Connect to your workflow
client = InferenceHTTPClient(
    api_url="https://serverless.roboflow.com",
    api_key="AA0MfTcjJZp1dQzv2mfz"
)

# 3. Run your workflow on an image
result = client.run_workflow(
    workspace_name="aicctv-6waqg",
    workflow_id="custom-workflow",
    images={
        "image": "2.jpg" # Path to your image file
    },
    use_cache=True # Speeds up repeated requests
)

# 4. Get your results
print(result)
