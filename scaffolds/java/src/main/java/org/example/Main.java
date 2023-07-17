package org.example;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;

// Press Shift twice to open the Search Everywhere dialog and type `show whitespaces`,
// then press Enter. You can now see whitespace characters in your code.
public class Main {
    public static void main(String[] args) {
        OkHttpClient client = new OkHttpClient();
        Request request = new Request.Builder()
                .url("http://playground.browserup.com/web/toys")
                .addHeader("Accept", "application/json")
                .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) throw new IOException("Unexpected code " + response);

            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode jsonNode = objectMapper.readTree(response.body().string());
            System.out.println(jsonNode.toString());
            think();
        } catch (IOException e) {
            e.printStackTrace();
        }

    }

    private static int parseToInt(String stringToParse, int defaultValue) {
        try {
            return Integer.parseInt(stringToParse);
        } catch(NumberFormatException ex) {
            return defaultValue; //Use default value if parsing failed
        }
    }
    static private void think(){
        int sleepFor = parseToInt(System.getenv("THINK_TIME" ), 10);
        int sleepForMs = sleepFor * 1000;
        try {
            System.out.println("Sleeping for " + sleepFor + " seconds");
            Thread.sleep(sleepForMs);
        }
        catch(InterruptedException e){
            System.out.println("Interrupted during sleep: " + e.getMessage());
        }
    }
}
