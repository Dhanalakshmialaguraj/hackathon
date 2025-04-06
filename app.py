from dotenv import load_dotenv
import os
load_dotenv()
from flask import Flask, request, jsonify
from flask_cors import CORS
import openai


#  Load .env file
load_dotenv()

#  Get API key from environment
openai.api_key = os.getenv("OPENAI_API_KEY")

app = Flask(__name__)
CORS(app)

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_message = data.get('message', '')

    try:
        response = openai.ChatCompletion.create(
            model='gpt-3.5-turbo',
            messages=[{'role': 'user', 'content': user_message}]
        )
        reply = response['choices'][0]['message']['content']
        return jsonify({'reply': reply})
    except Exception as e:
        print("OpenAI error:", e)  # Safe to show error message, NOT API key
        return jsonify({'error': 'Failed to get response from OpenAI'}), 500

if __name__ == '__main__':
    app.run(debug=True)
