import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
export default function Faqs(){
    return(      <section className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger>How do the sensor-based scans work?</AccordionTrigger>
              <AccordionContent>
                Our app uses your device built-in sensors to measure various health metrics.
                Simply follow the on-screen instructions for each measurement type.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Is the camera analysis safe and private?</AccordionTrigger>
              <AccordionContent>
                Yes, all camera-based analyses are performed locally on your device.
                Your privacy is our top priority, and no images are stored or transmitted.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>How accurate are the AI predictions?</AccordionTrigger>
              <AccordionContent>
                Our AI models are trained on extensive medical datasets and provide insights
                with high accuracy. However, they should not replace professional medical advice.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>)
}