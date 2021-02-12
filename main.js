
var vid_reggie = new RegExp(/v=([0-9A-Za-z_-]{10}[048AEIMQUYcgkosw])/);
var emb_vid_reggie = new RegExp(/embed\/([0-9A-Za-z_-]{10}[048AEIMQUYcgkosw])/);
var chan_reggie = new RegExp(/channelId%22%3A%22([0-9A-Za-z_-]{23}[AQgw])+%22/);

// Tracking browser and extension startup times ///////////////////////////
chrome.storage.sync.get(["lastStartup", "lastEnabled"], function (r) {
  console.log(`\nlast startup: ${r.lastStartup}\nlast enabled: ${r.lastEnabled}`)
});
var d = new Date();
chrome.windows.onCreated.addListener(function() {
  chrome.storage.sync.set({"lastStartup": d.toGMTString()})
})
chrome.storage.sync.set({"lastEnabled": d.toGMTString()})

// Update data in storage ////////////////////////////////////////////////
updateList = async () => {
  const allow_list_url = chrome.runtime.getURL('allows.json');
  const resp = await fetch(allow_list_url);
  list = await resp.json();
  chrome.storage.sync.set({"allows": list.allow}, function(){});
}
chrome.storage.sync.get(["allows"], function(list) {
  if (!list.allows) { updateList() };
});

// Build a list of allowed youtube channels //////////////////////////////
var filter_list;
filter_list = build_filter_list();

function build_filter_list() {
  var filter_list = [];
  chrome.storage.sync.get(["allows"], function(list) {
    if (!list.allows) {return filter_list};
    var i;
    for (i = 0; i < list.allows.length; i++) {
      filter_list.push(list.allows[i].id);
    } 
  });
  return filter_list;
}

// Apply a filter to each request to youtube /////////////////////////////
chrome.webRequest.onBeforeRequest.addListener(
  check,
  {urls: ["*://www.youtube.com/watch*",
          "*://www.youtube.com/embed*",
          "*://youtu.be/*"]},
  ["blocking"]
);

function check(req) {
  return {cancel: isAllowedRequest(req) ?  false : true}    
}

function isAllowedRequest(details) {
  var videoId = details.url.includes("/embed/")  ?
                emb_vid_reggie.exec(details.url) : 
                vid_reggie.exec(details.url)     ;
  try {
    return filter_list.includes(get_channel_id(videoId[1]));
  } catch(e) {
    console.log(e)
    return false;
  }
}

function get_channel_id(videoId) {
  // if (!reggie.test(`${videoId}`)) {
  //   console.log(`Can not work with: ${videoId}`);
  //   return
  // };
  const url = `https://www.youtube.com/get_video_info?video_id=${videoId}`;
  var request = new XMLHttpRequest(); // Deprecated ?
  request.open('GET', url, false);  // `false` makes the request synchronous
  request.send(null);

  try {
    return request.responseText.match(chan_reggie)[1];
  } catch(e) { 
    console.log(e);
    return "REQ_ERROR";
  }
}


