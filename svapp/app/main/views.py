from . import main
from . import common
# from . import ns_class
from . import log_class

import os
import time
from flask import jsonify, redirect
from flask import request, send_from_directory, current_app

# ns_service = ns_class.NS()


@main.route('/', methods=['GET'])
def main_portal():
    return redirect('/static/demo.html', code=302)


@main.route('/ajax_record', methods=['POST'])
def ajax_record():
    # parse argument
    try:
        os.system( "rm {}/*".format(current_app.config['UPLOAD_FOLDER']) )
        
        wav_path = os.path.join(
            current_app.config['UPLOAD_FOLDER'], 'demo.wav')
        # text_path = os.path.join(current_app.config['UPLOAD_FOLDER'], 'text')
        print ("wav_path: ", wav_path)
        request.files['data'].save(wav_path)
        # print ("text_path", str(text_path) )
        # with open(text_path, "w") as f:
        #     text_content = request.form['text'].replace(' ','')
        #     # text_content = text_content_.decode("utf-8")
        #     # print (text_content.encode('utf-8'), type(text_content.encode('utf-8')))
            
        #     f.write(text_content)
        
        os.system("cp {} {}".format(wav_path, os.path.join(
            current_app.config['RUN_FOLDER'], 'local', 'demo')))
        os.system(
            "cd {} && ./demo.sh".format(current_app.config['RUN_FOLDER']))
        os.system(
            "cp {} {}".format(os.path.join(current_app.config['DEMO_FOLDER'], 
            'demo_16k.wav'), current_app.config['UPLOAD_FOLDER']))

        # with open(os.path.join(current_app.config['UPLOAD_FOLDER'], 'text_utt.json'), "w") as f:
        #     json_str = f.read()

        with open(os.path.join(current_app.config['UPLOAD_FOLDER'], 'decode_result.txt'), "r") as f:
            line = f.read()
            decode_result = line.split('\n')[0].split("test_utt ")[1]
            print (decode_result)

        return jsonify(
            message=decode_result,
        )
    except Exception as e:
        # raise
        return jsonify(
            message=str(e),
        )


@main.route('/ns_download', methods=['GET', 'POST'])
def download():
    filename_ = request.form['my_json']
    return send_from_directory(directory=current_app.config['UPLOAD_FOLDER'], filename=filename_, as_attachment=True)
