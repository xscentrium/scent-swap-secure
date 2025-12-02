import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Star } from "lucide-react";

interface Listing {
  id: string;
  name: string;
  brand: string;
  size: string;
  condition: string;
  estimatedValue: number;
  ownerVerified: boolean;
  rating: number;
  image: string;
}

const mockListings: Listing[] = [
  {
    id: "1",
    name: "Aventus",
    brand: "Creed",
    size: "100ml",
    condition: "Like New",
    estimatedValue: 350,
    ownerVerified: true,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400"
  },
  {
    id: "2",
    name: "Baccarat Rouge 540",
    brand: "Maison Francis Kurkdjian",
    size: "70ml",
    condition: "New",
    estimatedValue: 325,
    ownerVerified: true,
    rating: 5.0,
    image: "https://images.unsplash.com/photo-1588405748880-12d1d2a59df9?w=400"
  },
  {
    id: "3",
    name: "Oud Wood",
    brand: "Tom Ford",
    size: "50ml",
    condition: "Excellent",
    estimatedValue: 280,
    ownerVerified: true,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400"
  },
  {
    id: "4",
    name: "Grand Soir",
    brand: "Maison Francis Kurkdjian",
    size: "70ml",
    condition: "Like New",
    estimatedValue: 310,
    ownerVerified: true,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=400"
  }
];

export const Marketplace = () => {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12 animate-in fade-in duration-700">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">
            Available for Trade
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse verified listings from collectors worldwide
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mockListings.map((listing, index) => (
            <Card 
              key={listing.id} 
              className="overflow-hidden hover:shadow-luxury transition-smooth group animate-in fade-in duration-700"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative aspect-square overflow-hidden bg-muted">
                <img 
                  src={listing.image} 
                  alt={listing.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                {listing.ownerVerified && (
                  <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground border-0">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">{listing.name}</h3>
                  <p className="text-sm text-muted-foreground">{listing.brand}</p>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{listing.size} • {listing.condition}</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-accent text-accent" />
                    <span className="font-medium">{listing.rating}</span>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">Est. Value</span>
                    <span className="font-semibold text-lg">${listing.estimatedValue}</span>
                  </div>
                  <Button className="w-full" variant="default">
                    Propose Trade
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
