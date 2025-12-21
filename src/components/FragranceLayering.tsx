import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FragranceSearch } from '@/components/FragranceSearch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layers, Plus, X, Sparkles, Info } from 'lucide-react';

type FragranceItem = {
  name: string;
  brand: string;
};

type LayeringSuggestion = {
  fragrances: FragranceItem[];
  reason: string;
  layeringMethod?: string;
  resultProfile: string;
  popularity?: string;
  priceRange?: string;
};

type LayeringCombination = {
  fragrances: string[];
  compatibilityScore: number;
  resultProfile: string;
  layeringTips: string;
  bestFor: string[];
};

// Classic layering combinations (non-AI)
const classicCombos = [
  {
    fragrances: [
      { name: 'Oud Wood', brand: 'Tom Ford' },
      { name: 'Tobacco Vanille', brand: 'Tom Ford' },
    ],
    reason: 'A warm, luxurious combination where the smoky oud meets rich tobacco and vanilla',
    resultProfile: 'Deep, sophisticated, and opulent',
    layeringMethod: 'Apply Oud Wood first, then layer Tobacco Vanille on top',
  },
  {
    fragrances: [
      { name: 'Bleu de Chanel', brand: 'Chanel' },
      { name: 'Allure Homme Sport', brand: 'Chanel' },
    ],
    reason: 'Fresh meets sporty for an energetic, clean scent',
    resultProfile: 'Fresh, citrusy with a woody dry-down',
    layeringMethod: 'Spray Bleu de Chanel on pulse points, Allure on clothes',
  },
  {
    fragrances: [
      { name: 'Black Orchid', brand: 'Tom Ford' },
      { name: 'Velvet Orchid', brand: 'Tom Ford' },
    ],
    reason: 'Double orchid intensity for a lush, feminine floral',
    resultProfile: 'Dark, dramatic florals with sensual undertones',
    layeringMethod: 'Equal parts of each, applied together',
  },
  {
    fragrances: [
      { name: 'Aventus', brand: 'Creed' },
      { name: 'Green Irish Tweed', brand: 'Creed' },
    ],
    reason: 'Fresh greenery meets fruity sophistication',
    resultProfile: 'Fresh, confident, and masculine',
    layeringMethod: 'Green Irish Tweed as base, Aventus as top layer',
  },
  {
    fragrances: [
      { name: 'Baccarat Rouge 540', brand: 'Maison Francis Kurkdjian' },
      { name: 'Grand Soir', brand: 'Maison Francis Kurkdjian' },
    ],
    reason: 'Crystal-like sweetness meets warm amber',
    resultProfile: 'Ethereal, sweet, and deeply luxurious',
    layeringMethod: 'Baccarat Rouge 540 first, Grand Soir to intensify warmth',
  },
];

export const FragranceLayering = () => {
  const [selectedFragrances, setSelectedFragrances] = useState<FragranceItem[]>([]);
  const [searchName, setSearchName] = useState('');
  const [searchBrand, setSearchBrand] = useState('');
  const [layeringGoal, setLayeringGoal] = useState('');
  const [shouldFetch, setShouldFetch] = useState(false);

  const { data: aiSuggestions, isLoading, error, refetch } = useQuery({
    queryKey: ['ai-layering', selectedFragrances, layeringGoal],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-layering', {
        body: {
          fragrances: selectedFragrances.length > 0 ? selectedFragrances : undefined,
          goal: layeringGoal || undefined,
        },
      });
      if (error) throw error;
      return data as { combinations?: LayeringCombination[]; suggestions?: LayeringSuggestion[] };
    },
    enabled: shouldFetch,
    staleTime: 1000 * 60 * 10,
  });

  const addFragrance = (name: string, brand: string) => {
    if (selectedFragrances.length >= 4) return;
    if (selectedFragrances.some(f => f.name === name && f.brand === brand)) return;
    setSelectedFragrances(prev => [...prev, { name, brand }]);
    setSearchName('');
    setSearchBrand('');
  };

  const removeFragrance = (index: number) => {
    setSelectedFragrances(prev => prev.filter((_, i) => i !== index));
  };

  const handleGetSuggestions = () => {
    setShouldFetch(true);
    refetch();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          Fragrance Layering
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="classic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="classic">Classic Combos</TabsTrigger>
            <TabsTrigger value="ai">AI Suggestions</TabsTrigger>
          </TabsList>

          <TabsContent value="classic" className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Popular fragrance layering combinations loved by the community
            </p>
            {classicCombos.map((combo, idx) => (
              <div key={idx} className="p-4 rounded-lg border bg-card">
                <div className="flex flex-wrap gap-2 mb-3">
                  {combo.fragrances.map((f, i) => (
                    <Badge key={i} variant="secondary" className="text-sm">
                      {f.name} <span className="text-muted-foreground ml-1">by {f.brand}</span>
                    </Badge>
                  ))}
                </div>
                <p className="text-sm font-medium mb-1">{combo.reason}</p>
                <p className="text-sm text-muted-foreground mb-2">Result: {combo.resultProfile}</p>
                <div className="flex items-start gap-2 text-xs text-primary">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{combo.layeringMethod}</span>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="ai" className="mt-4 space-y-6">
            {/* Goal input */}
            <div className="space-y-2">
              <Label>What scent are you trying to create?</Label>
              <Input
                placeholder="e.g., A warm vanilla scent perfect for winter date nights"
                value={layeringGoal}
                onChange={(e) => setLayeringGoal(e.target.value)}
              />
            </div>

            {/* Or select fragrances */}
            <div className="space-y-3">
              <Label>Or select fragrances to analyze layering compatibility:</Label>
              
              {selectedFragrances.length < 4 && (
                <FragranceSearch
                  nameValue={searchName}
                  brandValue={searchBrand}
                  onNameChange={setSearchName}
                  onBrandChange={setSearchBrand}
                  onSelect={(f) => addFragrance(f.name, f.brand)}
                  nameId="layering-name"
                  brandId="layering-brand"
                />
              )}

              {selectedFragrances.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedFragrances.map((f, idx) => (
                    <Badge key={idx} variant="outline" className="gap-1 py-1.5">
                      {f.name} - {f.brand}
                      <button onClick={() => removeFragrance(idx)} className="ml-1 hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Button 
              onClick={handleGetSuggestions} 
              disabled={isLoading || (!layeringGoal && selectedFragrances.length === 0)}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isLoading ? 'Analyzing...' : 'Get AI Layering Suggestions'}
            </Button>

            {/* Results */}
            {isLoading && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 rounded-lg" />
                ))}
              </div>
            )}

            {error && (
              <div className="text-center py-4 text-destructive">
                <p>Failed to get suggestions. Please try again.</p>
              </div>
            )}

            {aiSuggestions?.combinations && (
              <div className="space-y-4">
                <h4 className="font-medium">Layering Analysis</h4>
                {aiSuggestions.combinations.map((combo, idx) => (
                  <div key={idx} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex flex-wrap gap-2">
                        {combo.fragrances.map((f, i) => (
                          <Badge key={i} variant="secondary">{f}</Badge>
                        ))}
                      </div>
                      <Badge variant={combo.compatibilityScore >= 7 ? 'default' : 'outline'}>
                        {combo.compatibilityScore}/10
                      </Badge>
                    </div>
                    <p className="text-sm mb-2">{combo.resultProfile}</p>
                    <p className="text-sm text-muted-foreground mb-2">{combo.layeringTips}</p>
                    <div className="flex flex-wrap gap-1">
                      {combo.bestFor.map((occasion) => (
                        <Badge key={occasion} variant="outline" className="text-xs">
                          {occasion}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {aiSuggestions?.suggestions && (
              <div className="space-y-4">
                <h4 className="font-medium">Suggested Combinations</h4>
                {aiSuggestions.suggestions.map((sug, idx) => (
                  <div key={idx} className="p-4 rounded-lg border bg-card">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {sug.fragrances.map((f, i) => (
                        <Badge key={i} variant="secondary">
                          {f.name} <span className="text-muted-foreground ml-1">by {f.brand}</span>
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm font-medium mb-1">{sug.reason}</p>
                    <p className="text-sm text-muted-foreground mb-2">Result: {sug.resultProfile}</p>
                    {sug.layeringMethod && (
                      <div className="flex items-start gap-2 text-xs text-primary">
                        <Info className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{sug.layeringMethod}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
