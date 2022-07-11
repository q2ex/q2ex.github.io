<?php
$url =$_GET['url']; //视频地址
$dyItem = get_location($url); //获取301跳转后地址
preg_match_all('/video\/(.*?)\//', $dyItem, $dyArr); //正则提取item_ids
if (!empty($dyArr[1][0])) {
    $url = "https://www.iesdouyin.com/web/api/v2/aweme/iteminfo/?item_ids={$dyArr[1][0]}&dytk=";
    $VideoTemp = curl_request($url);
    if (!empty($VideoTemp)) {
        $videoArr = json_decode($VideoTemp, true);
        $video = $videoArr['item_list'][0]['video'];
        $playUrl = $video['play_addr']['url_list'][0];
        $play_url2 = get_location(str_replace("playwm", "play", $playUrl));
        $data = array(
            'desc' => $videoArr['item_list']['0']['desc'],
            'cover' => $video['origin_cover']['url_list'][0],
            'play_url' => get_location($playUrl) ,
            'play_url2' => $play_url2,
        );
        echo "封面地址：".$data['cover']."<br/>";
		echo "封面描述：".$data['desc']."<br/>";
		echo "播放地址：".$data['play_url']."<br/>";
		echo "无水印地址：".$data['play_url2']."<br/>";
    }
} else {
    echo "网址获取失败";
}
function get_location($url) {
    $headers = get_headers($url, TRUE);
    if (!empty($headers['location'])) {
        return $headers['location'];
    }
    return '';
}
function curl_request($url, $post = '', $cookie = '', $returnCookie = 0, $headers = '') {
    $curl = curl_init();
    if (!empty($headers)) {
        curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
    }
    curl_setopt($curl, CURLOPT_URL, $url);
    curl_setopt($curl, CURLOPT_USERAGENT, 'Mozilla/5.0 (Linux; Android 7.1.1; Mi Note 3 Build/NMF26X; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/61.0.3163.98 Mobile Safari/537.36');
    curl_setopt($curl, CURLOPT_FOLLOWLOCATION, 1);
    curl_setopt($curl, CURLOPT_AUTOREFERER, 1);
    curl_setopt($curl, CURLOPT_REFERER, "");
    if ($post) {
        curl_setopt($curl, CURLOPT_POST, 1);
        curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($post));
    }
    if ($cookie) {
        curl_setopt($curl, CURLOPT_COOKIE, $cookie);
    }
    curl_setopt($curl, CURLOPT_ENCODING, 'gzip');
    curl_setopt($curl, CURLOPT_HEADER, $returnCookie);
    curl_setopt($curl, CURLOPT_TIMEOUT, 10);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
    $data = curl_exec($curl);
    if (curl_errno($curl)) {
        return curl_error($curl);
    }
    curl_close($curl);
    if ($returnCookie) {
        list($header, $body) = explode("\r\n\r\n", $data, 2);
        preg_match_all("/Set\-Cookie:([^;]*);/", $header, $matches);
        $info['bodys'] = $matches;
        $info['cookie'] = substr($matches[1][0], 1);
        $info['content'] = $body;
        return $info;
    } else {
        return $data;
    }
}
?>
