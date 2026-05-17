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

    # Temporary AI response
    answer = f"AI Response for: {question}"

    return f"""
    <h2>Your Question:</h2>
    <p>{question}</p>

    <h2>AI Answer:</h2>
    <p>{answer}</p>

    <a href='/'>Go Back</a>
    """

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=81)