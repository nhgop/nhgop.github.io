$(document).ready(function() {
	$("#go").click(function(e) {
		e.preventDefault();
		var key = document.getElementById("API_key").value;
		$.ajax({
			url: "https://api.legiscan.com/?key=" + key + "&op=getSessionList&state=NH",
			dataType: "json",
			success: function(data) {
				var list = document.getElementById("list");
				
				for(let i = 0; i < Object.keys(data.sessions).length; i++) {
					var option_item = document.createElement("option");
					option_item.value = data.sessions[i].session_id;
					option_item.innerHTML = data.sessions[i].name;
					list.appendChild(option_item);
				}
				
				list.style.display = "inline";
				document.getElementById("bills").style.display = "inline";
			}
		});
	});
	
	$("#bills").click(function(e) {		
		e.preventDefault();
		var list = document.getElementById("list");
		var selection = list.options[list.selectedIndex].value;
		var key = document.getElementById("API_key").value;
		document.getElementById("result").innerHTML = "";
		$.ajax({
			url: "https://api.legiscan.com/?key=" + key + "&op=getMasterList&id=" + selection,
			dataType: "json",
			success: function(data) {
				var result_div = document.getElementById("result");
				
				//Clear any current text
				result_div.innerHTML = "";

				var array = [];
				var num_bills = Object.keys(data.masterlist).length - 2;

				//Loop through all of the bills
				for(var i = 0; i < num_bills; i++) {
					var bill = data.masterlist[i];
					$.ajax({
						url: "https://api.legiscan.com/?key=8388089c6619c86ff33e7535672b24ef&op=getBill&id=" + bill.bill_id,
						dataType: "json",
						async: false,
						success: function(data) {
							if(data.bill.bill_type == "B") {
								var statuses = ["Intro", "Passed " + getBody(bill.current_body), "On Governor's Desk", "Law", "Vetoed"];
								var array_item = [bill.number, removeCommas(bill.title), statuses[bill.status-1], data.bill.history[Object.keys(data.bill.history).length-1].date, getBody(data.bill.body), "", removeCommas(bill.description)];
								for(let j = 0; j < Object.keys(data.bill.sponsors).length; j++) {
									array_item.push(data.bill.sponsors[j].name);
									array_item.push((data.bill.sponsors[j].party == "R" ? "Republican" : "Democrat"));
								}
								array.push(array_item);
							}
						},
						failure: function(data) {
							alert("FAILED : " + data);
						}
					});
				}	
				downloadCSV(toCSV(array));
			}
		});
	});
});

function getBody(body) {
	return (body == "H") ? "House" : "Senate";
}

//Sanitize input string to remove commas that are used as delimeters in CSV
function removeCommas(string) {
	return string.replace(/,/g, "");
}

function toCSV(data) {
	var csv = "Bill #, Bill Name, Status, Date of Last Action, Legislative Body, Topic, Description,";
	
	//Add the sponsors to the CSV heading
	for(let i = 1; i < 25; i++) {
		csv += "Sponsor " + i.toString() + ",Party" + (i<24 ? "," : "\n");
	}
	
	for(let i = 0; i < data.length; i++) {
		for(let j = 0; j < 48; j++) {
			if(typeof data[i][j] == 'undefined') {
				csv += (j < 47 ? "," : "\n");
			} else {
				csv += data[i][j] + (j < 47 ? "," : "\n");
			}
		}
	}
	return csv;
}

function downloadCSV(csv) {
	var blob = new Blob([csv], {type: "text/css"});
	var download_link = document.createElement("a");
	download_link.href = URL.createObjectURL(blob);
	download_link.download = "NH_bills.csv";
	download_link.innerHTML = "Download CSV";
	download_link.style.color = "white";
	download_link.style.fontSize = "large";
	document.getElementById("result").appendChild(document.createElement("br"));
	document.getElementById("result").appendChild(download_link);
}