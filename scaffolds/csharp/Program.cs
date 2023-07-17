using System.Net.Http.Headers;
using CSharpExample;
using System.Text.Json;

string url = "http://playground.browserup.com/toys";
string urlParameters = "";

using var client = new HttpClient();
client.BaseAddress = new Uri(url);
// Add an Accept header for JSON format.
client.DefaultRequestHeaders.Accept.Add(
   new MediaTypeWithQualityHeaderValue("application/json"));
// Get data response
var response = client.GetAsync(urlParameters).Result;
if (response.IsSuccessStatusCode)
{

    // Parse the response body
    string data = await response.Content.ReadAsStringAsync();
    var toys = JsonSerializer.Deserialize<List<Toy>>(data);
    if (toys == null) { return 0; }
    foreach (var t in toys)
    {
        Console.WriteLine("{0}", t.Name);
    }
    return 0;
}
else
{
    Console.WriteLine("{0} ({1})", (int)response.StatusCode, response.ReasonPhrase);
    return 1;
}
