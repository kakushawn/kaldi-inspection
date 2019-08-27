def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1] in ['.wav', '.WAV']
