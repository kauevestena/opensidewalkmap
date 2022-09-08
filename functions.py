from time import sleep

def a_href_str(text,url):

    return f'<a href="{url}">{text}</a>'


def simple_highlight(feature):
    return {
    'weight':12,
    }

def replace_at_html(html_filepath,original_text,new_text,count=1):
    '''
    Quick and dirty way to replace some stuff directly on the webpage 

    Originally intended only for <head>

    beware of tags that repeat! the "count" argument is very important!
    '''


    with open(html_filepath) as reader:
        pag_txt = reader.read()

    
    with open(html_filepath,'w+') as writer:
        writer.write(pag_txt.replace(original_text,new_text,count))

    sleep(.1)