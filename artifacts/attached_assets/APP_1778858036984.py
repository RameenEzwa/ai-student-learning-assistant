from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

@app.route('/')
def home():
    return """
    <h1>AI Student Learning Assistant</h1>
    <form action='/ask' method='post'>
        <input type='text' name='question' placeholder='Ask a question'>
        <button type='submit'>Ask AI</button>
    </form>
    """

@app.route('/ask', methods=['POST'])
def ask():
    question = request.form['question']

from flask import Flask, request
import google.generativeai as genai

app = Flask(__name__)

# Paste your Gemini API key here
genai.configure(api_key="AIzaSyBOyJHC_G1K6NKhZ2rCj9-aASdKjx1Tjlw")

model = genai.GenerativeModel("gemini-1.5-flash")

@app.route('/')
def home():
    return """
    <h1>AI Student Learning Assistant</h1>

    <form action='/ask' method='post'>

        <input type='text' name='question'
        placeholder='Ask your study question'>

        <button type='submit'>Ask AI</button>

    </form>
    """

@app.route('/ask', methods=['POST'])
def ask():

    question = request.form['question']

    response = model.generate_content(question)

    answer = response.text

    return f"""

    <h2>Your Question:</h2>
    <p>{question}</p>

    <h2>AI Answer:</h2>
    <p>{answer}</p>

    <br>
    <a href='/'>Ask Another Question</a>

    """

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=81)