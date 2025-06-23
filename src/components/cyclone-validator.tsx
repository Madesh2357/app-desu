"use client";

import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Bot, CheckCircle, Hourglass, Info, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { validateCyclonePrediction } from '@/app/actions';
import type { ValidateFuzzyLogicOutput } from '@/ai/flows/validate-fuzzy-logic';

const formSchema = z.object({
  fuzzyLogicOutput: z.string().min(10, {
    message: "Fuzzy logic output must be at least 10 characters.",
  }),
  weatherData: z.string().min(10, {
    message: "Weather data must be at least 10 characters.",
  }),
});

export default function CycloneValidator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidateFuzzyLogicOutput | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fuzzyLogicOutput: "",
      weatherData: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setResult(null);
    const validationResult = await validateCyclonePrediction(values);
    setResult(validationResult);
    setLoading(false);
  }

  return (
    <>
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Intelligent Cyclone Prediction</CardTitle>
              <CardDescription>
                Use AI to validate and refine cyclone predictions from your Fuzzy Logic algorithm.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="fuzzyLogicOutput"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuzzy Logic Output</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., 'Cyclone probability: 85%, Category 2, expected landfall in 48 hours.'"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the raw prediction output from your fuzzy logic model.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weatherData"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weather Data</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., 'Temp: 29°C, Humidity: 92%, Wind: 60km/h, Pressure: 980mb'"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide the key weather data points used for the prediction.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={loading}>
                {loading ? <Hourglass className="mr-2 animate-spin" /> : <Bot className="mr-2" />}
                Analyze with AI
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-xl">AI Validation Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2 flex items-center">
                <Info className="mr-2 h-5 w-5 text-primary" />
                Validation Status
              </h3>
              {result.isValid ? (
                <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Valid Prediction
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="mr-2 h-4 w-4" />
                  Refinement Needed
                </Badge>
              )}
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2 flex items-center">
                <Bot className="mr-2 h-5 w-5 text-primary" />
                Refined Prediction
              </h3>
              <p className="text-sm p-3 bg-secondary rounded-md">{result.refinedPrediction}</p>
            </div>
            
            <Separator />

            <div>
              <h3 className="font-semibold mb-2 flex items-center">
                <Info className="mr-2 h-5 w-5 text-primary" />
                AI Reasoning
              </h3>
              <p className="text-sm p-3 bg-secondary rounded-md">{result.reasoning}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
