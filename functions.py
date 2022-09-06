


def a_href_str(text,url):
    url = url.strip('/')
    print(f"<a href={url}>{text}</a>")
    return f"<a href={url}>{text}</a>"
