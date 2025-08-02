set -e

SECRET_ID="music-app-api/secrets-jyimaQ"
ENV_FILE="${1:-.env}"  # Default to .env in current dir

if [[ ! -f "$ENV_FILE" ]]; then
  echo "? .env file not found at: $ENV_FILE"
  exit 1
fi

# Fetch existing secret value
echo "?? Fetching current secrets from AWS Secrets Manager..."
CURRENT_SECRET=$(aws secretsmanager get-secret-value --secret-id "$SECRET_ID" --query SecretString --output text 2>/dev/null || echo "{}")

# Use jq to parse existing secret JSON
TMP_FILE=$(mktemp)
echo "$CURRENT_SECRET" | jq '.' > "$TMP_FILE"

# Read each line in the .env file
echo "?? Reading from .env file..."
while IFS='=' read -r key value; do
  # Skip comments and empty lines
  [[ "$key" =~ ^#.*$ || -z "$key" ]] && continue

  # Trim whitespace
  key=$(echo "$key" | xargs)
  value=$(echo "$value" | xargs)

  [[ "$key" = "" ]] && continue
  [[ "$value" = "" ]] && continue

  # Check if key exists in the current secret
  if jq -e --arg k "$key" '.[$k]' "$TMP_FILE" > /dev/null; then
    : # echo "?? Key '$key' already exists, skipping..."
  else
    echo "? Adding new key '$key'"
    jq --arg k "$key" --arg v "$value" '. + {($k): $v}' "$TMP_FILE" > "${TMP_FILE}.tmp" && mv "${TMP_FILE}.tmp" "$TMP_FILE"
  fi
done < "$ENV_FILE"

# Update secret in AWS
echo "?? Updating secret in AWS Secrets Manager..."
aws secretsmanager update-secret --secret-id "$SECRET_ID" --secret-string "$(cat "$TMP_FILE")" >> /dev/null

# Clean up
rm "$TMP_FILE"

echo "? Secret updated successfully."
