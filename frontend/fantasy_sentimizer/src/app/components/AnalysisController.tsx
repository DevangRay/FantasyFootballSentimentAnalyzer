"use client"
import { useEffect, useState } from "react";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { getPlayerObjectForAnalysis, getNFLPlayers, performAnalysis, performAnalysisStream } from "@/app/api/sentiment_analysis_api";
import HighlightWord from "@/app/components/HighlightPlayer";
import PlayerCard from "@/app/analyze/components/PlayerCard";
import { SentimentObject } from "@/app/types/analyze-types";
import { delay } from "@/app/utils/functions";

const labelColorMap: Record<string, { text: string; bg: string }> = {
    positive: { text: "#22c55e", bg: "#dcfce7" },
    negative: { text: "#ef4444", bg: "#fee2e2" },
    neutral: { text: "#2563eb", bg: "#dbeafe" },
}

export default function AnalysisController({ submittedText }: { submittedText: string }) {
    const [loading, setLoading] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);
    const [loadingMessage, setLoadingMessage] = useState<string>("Starting analysis...");
    const [apiResult, setApiResult] = useState<SentimentObject>({});
    const [analysisResult, setAnalysisResult] = useState<SentimentObject>({});
    const [sortedPlayers, setSortedPlayers] = useState<string[]>([]);
    const [showSidebar, setShowSidebar] = useState<boolean>(true);
    const [openDrawerPlayer, setOpenDrawerPlayer] = useState<string | null>(null);

    useEffect(() => {
        const cancellationToken = { cancelled: false };

        // mockCallAPI();
        // callAPI();
        callAPIStream(cancellationToken);

        return () => {
            cancellationToken.cancelled = true;
        }
    }, [])

    function onSwitchClick() {
        setShowSidebar(!showSidebar);
        setOpenDrawerPlayer(null);
    }

    function sortPlayersByMentions(obj: SentimentObject, order = 'desc') {
        return Object.keys(obj)
            .sort((a, b) => {
                const lengthA = obj[a]["detailed_sentiment"]?.length || 0;
                const lengthB = obj[b]["detailed_sentiment"]?.length || 0;
                return order === 'desc' ? lengthB - lengthA : lengthA - lengthB;
            });
    }

    function sortPlayersByStatusAndMentions(obj: SentimentObject) {
        return Object.keys(obj)
            .sort((a, b) => {
                const statusOrder = {
                    "perfect match": 0,
                    "best of multiple matches": 1
                }

                const statusDiff = statusOrder[obj[a].status] - statusOrder[obj[b].status]
                if (statusDiff !== 0) return statusDiff;

                return obj[b].detailed_sentiment.length - obj[a].detailed_sentiment.length;
            })

    }

    function mockCallAPI() {
        setLoading(true);
        const results: SentimentObject = {
            "Aaron Adeoye": {
                "average_label": "neutral",
                "detailed_sentiment": [
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.629146099090576,
                            "neutral": -3.3877978324890137,
                            "positive": -3.4777934551239014
                        },
                        "text": "Yeah, you did say that. Did I not say that? And here we are just a month later in Aaron engage. So tech I mean I was the one breaking news. I was the one that not breaking news."
                    }
                ],
                "most_frequent_label": "neutral",
                "player_id": "3910148",
                "sentiment_consensus": {
                    "negative": -3.629146099090576,
                    "neutral": -3.3877978324890137,
                    "positive": -3.4777934551239014
                },
                "status": "best of multiple matches",
                "transcript_name": "Aaron"
            },
            "Alvin Kamara": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.022519111633301,
                            "neutral": -3.715744972229004,
                            "positive": -2.383521318435669
                        },
                        "text": "I love his talent. It's just where the target shares where the opportunities, right? It's a that it all comes down to system and why we love again Alvin Kamaro so much because of the system he plays and how he plays. It's not as do the players. So, is there a path for Sam LePorta to join those elite guys again?"
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "3054850",
                "sentiment_consensus": {
                    "negative": -4.022519111633301,
                    "neutral": -3.715744972229004,
                    "positive": -2.383521318435669
                },
                "status": "perfect match",
                "transcript_name": "Alvin Kamaro"
            },
            "Ben Banogu": {
                "average_label": "neutral",
                "detailed_sentiment": [
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.633939743041992,
                            "neutral": -2.3661341667175293,
                            "positive": -3.4449801445007324
                        },
                        "text": "Obviously, year two with um Jaden Daniels, I think the whole offense is going to be better and humming and obviously they they got uh Terry in which is I think great news just for this whole kind of thing going on and you know they're they're they brought in Z I think as a guy that they felt familiar with and they drafted Ben Sinnott last year. really hasn't come together for Ben um yet and had a rough camper I heard rather yeah even even in camp hasn't been great so I think that's going to make them kind of rely on Z even more John Bates is a fine tight end he's just not going to be a factor in the pass catching realm and Z had a really good kick"
                    }
                ],
                "most_frequent_label": "neutral",
                "player_id": "3124970",
                "sentiment_consensus": {
                    "negative": -2.633939743041992,
                    "neutral": -2.3661341667175293,
                    "positive": -3.4449801445007324
                },
                "status": "best of multiple matches",
                "transcript_name": "Ben"
            },
            "Bijan Robinson": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.0052103996276855,
                            "neutral": -1.5323458909988403,
                            "positive": -0.7643593549728394
                        },
                        "text": "I mean, it is it's Drake London to be Well, right. I'm sorry. besides Bijan Robinson, who is actually the number two. Um, but like down like a downfield, but young guys tend to not check it down as much. They tend to take more chances downfield."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4430807",
                "sentiment_consensus": {
                    "negative": -2.0052103996276855,
                    "neutral": -1.5323458909988403,
                    "positive": -0.7643593549728394
                },
                "status": "perfect match",
                "transcript_name": "Bijan Robinson"
            },
            "Blake Ferguson": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.1418721675872803,
                            "neutral": -2.175111770629883,
                            "positive": -2.128349781036377
                        },
                        "text": "It got real wonky to back here because there's so many guys I wanted to get in, right? I I found a path for John Smith with paired back up with Arthur Smith to be the clear number two option in Pittsburgh. I think there's a chance for him to be Ferguson. I'm spread knowing how to hit him. Jake Ferguson has a chance like all those guys are all sitting there."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "3843470",
                "sentiment_consensus": {
                    "negative": -3.1418721675872803,
                    "neutral": -2.175111770629883,
                    "positive": -2.128349781036377
                },
                "status": "best of multiple matches",
                "transcript_name": "Ferguson"
            },
            "Bralon Addison": {
                "average_label": "negative",
                "detailed_sentiment": [
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -1.9412211179733276,
                            "neutral": -3.0799973011016846,
                            "positive": -3.211458683013916
                        },
                        "text": "Only only played 10 games. He he probably is probably a little bit low for me right now that we're discussing things and talking about him on a podcast uh and not writing them down, which is which is very very easy to do. Um, listen, I I do think obviously especially with what's his name um being Addison. Addison being uh gone suspended for a couple games. Was it three games?"
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -1.5863499641418457,
                            "neutral": -3.656517505645752,
                            "positive": -4.374256134033203
                        },
                        "text": "He he probably is probably a little bit low for me right now that we're discussing things and talking about him on a podcast uh and not writing them down, which is which is very very easy to do. Um, listen, I I do think obviously especially with what's his name um being Addison. Addison being uh gone suspended for a couple games. Was it three games? Four."
                    }
                ],
                "most_frequent_label": "negative",
                "player_id": "2971271",
                "sentiment_consensus": {
                    "negative": -1.7637855410575867,
                    "neutral": -3.3682574033737183,
                    "positive": -3.7928574085235596
                },
                "status": "best of multiple matches",
                "transcript_name": "Addison"
            },
            "Brock Bowers": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -1.6406577825546265,
                            "neutral": -3.999655246734619,
                            "positive": -2.254528284072876
                        },
                        "text": "I think I I think I So, he's not a top three round pick for you. No, I have to move him down specifically every single time. And I think I forgot I had to move I have to I have to go back in and move Brock Bowers down because when I don't it automatically moves him to my number one overall player. So, and I and it was just it was a it must have been like I I did an update, I forgot to just move him. Gotcha."
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -1.0761058330535889,
                            "neutral": -2.3937740325927734,
                            "positive": -2.407223701477051
                        },
                        "text": "Yeah, it was less than cordial. Uh but I was looking at the ADP of where these guys were going and it shows it right here as well. Brock Bowers goes off the board at 17. Yeah, understandable. Sure."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.785482406616211,
                            "neutral": -2.1958940029144287,
                            "positive": -2.3650307655334473
                        },
                        "text": "100%. That's the value. Every reddraft league I've done so far, every best ball draft I've done, I let everybody jump on Brock I wait for Brock Bowers to go. Trey McBride goes like real quick after and I make sure I get George Kittle because that is where the value is. instead of taking Brock Bowers and, you know, missing out on that elite other running back or top tier receiver, I'm like, dude, I'm just gonna get George Kittle."
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -1.8794070482254028,
                            "neutral": -2.332491874694824,
                            "positive": -2.16849946975708
                        },
                        "text": "Every reddraft league I've done so far, every best ball draft I've done, I let everybody jump on Brock I wait for Brock Bowers to go. Trey McBride goes like real quick after and I make sure I get George Kittle because that is where the value is. instead of taking Brock Bowers and, you know, missing out on that elite other running back or top tier receiver, I'm like, dude, I'm just gonna get George Kittle. Let me ask you this, though. You're sitting there at the last pick of the draft."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.6402647495269775,
                            "neutral": -2.2849040031433105,
                            "positive": -1.1588035821914673
                        },
                        "text": "I really wanted to put George Kittle as my tight end. I wanted to I didn't, but I I wanted to, but then I was like, dude, Jacobe Myers is always being already being whiny about his time over there. Like, dude, Brock Bowers is again all the targets. Number one, all the targets. So, Brock Bowers, he was tight end one last year, but on points per game basis, George Kittle was tight end one."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.220152854919434,
                            "neutral": -2.1868319511413574,
                            "positive": -1.0489778518676758
                        },
                        "text": "Like, dude, Brock Bowers is again all the targets. Number one, all the targets. So, Brock Bowers, he was tight end one last year, but on points per game basis, George Kittle was tight end one. True. Just mind you that."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.50266695022583,
                            "neutral": -1.553314208984375,
                            "positive": -2.2674312591552734
                        },
                        "text": "True. Just mind you that. So Brock Bowers one, George Kittle two, Trey Trey McBride three. I just I went chalky chalk. I went Brock Bowers Trey Trey McBride Trey McBride then George Kittle same as last year's um finish."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -4.396917343139648,
                            "neutral": -3.375986099243164,
                            "positive": -4.784100532531738
                        },
                        "text": "It's a guy who's gonna be the number two target in their offense. It's only you be the first or second target in their offense. Obviously, uh you have Brock Bowers is number one target. Trey Trey McBride, you can argue is number one target with Kyler Murray in that offense. George Kittle, if he's not number one, he's 1B, right?"
                    }
                ],
                "most_frequent_label": "negative",
                "player_id": "4432665",
                "sentiment_consensus": {
                    "negative": -2.767706871032715,
                    "neutral": -2.5403564274311066,
                    "positive": -2.306824430823326
                },
                "status": "perfect match",
                "transcript_name": "Brock Bowers"
            },
            "Caleb Benenoch": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -5.817081451416016,
                            "neutral": -2.8807196617126465,
                            "positive": -2.161867618560791
                        },
                        "text": "um when they got they got the ball in Kosen Levenson's hand on a quick easy pass right away and then another one you know a few plays later right down the seam and you know how do you make things easy on your quarterback is is give him predetermined quick easy reads that he can you know hit that back foot and and let it rip and Caleb we talked about it Caleb Williams actually looked good doing that we weren't sure if he was able to if he was going to be able to play within the confines of like a structured offense like that and he looked good doing it. And I think the way you kind of do that is make give him short, quick, easy passes and get him in a rhythm early. And I think they're going to try to establish that kind of offense pretty much throughout the entire year."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "3047575",
                "sentiment_consensus": {
                    "negative": -5.817081451416016,
                    "neutral": -2.8807196617126465,
                    "positive": -2.161867618560791
                },
                "status": "best of multiple matches",
                "transcript_name": "Caleb"
            },
            "Caleb Johnson": {
                "average_label": "neutral",
                "detailed_sentiment": [
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.8795926570892334,
                            "neutral": -2.6215929985046387,
                            "positive": -2.8884828090667725
                        },
                        "text": "So like my suggestion was like, \"Hey, move off of Sam LePorta for like even like a guy like in David Njoku extender plus, right? Because you could probably get David and David Njoku plus a first uh this year.\" And just imagine if you got you sold David Sam LePorta for David and David Njoku in like 111 and now you can sit there either with Sam LePorta and like Caleb Johnson. Sam Sam or I'm sorry um David and David Njoku. Yeah, David and David Njoku and Caleb Johnson, RJ Harvey, Colston Love, another tight end, a Jackson Dart."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -4.119281768798828,
                            "neutral": -2.9277732372283936,
                            "positive": -3.430501699447632
                        },
                        "text": "And just imagine if you got you sold David Sam LePorta for David and David Njoku in like 111 and now you can sit there either with Sam LePorta and like Caleb Johnson. Sam Sam or I'm sorry um David and David Njoku. Yeah, David and David Njoku and Caleb Johnson, RJ Harvey, Colston Love, another tight end, a Jackson Dart. like and I feel much more comfortable with that combination because I'm with you Matt like as it's going to take another receiver to leave that for him to get into that situation"
                    }
                ],
                "most_frequent_label": "neutral",
                "player_id": "4569383",
                "sentiment_consensus": {
                    "negative": -3.9994372129440308,
                    "neutral": -2.774683117866516,
                    "positive": -3.159492254257202
                },
                "status": "perfect match",
                "transcript_name": "Caleb Johnson"
            },
            "Caleb Williams": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.490664482116699,
                            "neutral": -2.797001838684082,
                            "positive": -2.27099347114563
                        },
                        "text": "um when they got they got the ball in Kosen Levenson's hand on a quick easy pass right away and then another one you know a few plays later right down the seam and you know how do you make things easy on your quarterback is is give him predetermined quick easy reads that he can you know hit that back foot and and let it rip and Caleb we talked about it Caleb Williams actually looked good doing that we weren't sure if he was able to if he was going to be able to play within the confines of like a structured offense like that and he looked good doing it. And I think the way you kind of do that is make give him short, quick, easy passes and get him in a rhythm early. And I think they're going to try to establish that kind of offense pretty much throughout the entire year."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4431611",
                "sentiment_consensus": {
                    "negative": -4.490664482116699,
                    "neutral": -2.797001838684082,
                    "positive": -2.27099347114563
                },
                "status": "perfect match",
                "transcript_name": "Caleb Williams"
            },
            "Colston Loveland": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.141888618469238,
                            "neutral": -2.8531384468078613,
                            "positive": -1.0972192287445068
                        },
                        "text": "And I think that's kind of gonna kind of snowball into Coulson Lovelin getting a lot of targets and then getting a lot of confidence. And once you have that kind of stuff established and the kind of chemistry established with the quarterback, hey, I know you're going to be here when when you're supposed to be and I can let it rip and you're going to make that catch and get me yards after the catch, which is something Coulson Lovelin is very good at. I think I think it's going to be kind of a glove inhand fit with with Coulson Lovelin, the young quarterback, and this offense. I kind of felt that way about Tyler Warren. We saw him, he's coming out of Penn State."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -5.005090713500977,
                            "neutral": -5.01057243347168,
                            "positive": -4.112458229064941
                        },
                        "text": "I kind of felt that way about Tyler Warren. We saw him, he's coming out of Penn State. We said when scouting him, he's probably the most pro ready tight end that we saw that probably had like I think we talked about like it wouldn't surprise us if Tyler Warren had the most productive year one, but if it wouldn't surprise us also if Coulson Leland had a better long-term career. Um coming off a year at Penn State where he had 104 catches uh for over,200 yards out there. All reports that I've seen so far coming out of Indianapolis is that this coaching staff has been working on getting Tyler Warren involved in offense early and often."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.812403440475464,
                            "neutral": -3.149608612060547,
                            "positive": -2.6025171279907227
                        },
                        "text": "So, you but you still haven't finished as tight end eight amongst such a crowded room of weapons here. DJ Moore, uh, Romo Dunay, the the staff has been raving about Luther Burton over the last two weeks. So, how does how does Colston Lovelin carve out a path in a 2025 season as a rookie tight end? Yeah. Yeah."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.8957104682922363,
                            "neutral": -2.44195818901062,
                            "positive": -3.301187515258789
                        },
                        "text": "And just imagine if you got you sold David Sam LePorta for David and David Njoku in like 111 and now you can sit there either with Sam LePorta and like Caleb Johnson. Sam Sam or I'm sorry um David and David Njoku. Yeah, David and David Njoku and Caleb Johnson, RJ Harvey, Colston Love, another tight end, a Jackson Dart. like and I feel much more comfortable with that combination because I'm with you Matt like as it's going to take another receiver to leave that for him to get into that situation"
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.8789987564086914,
                            "neutral": -0.9921204447746277,
                            "positive": -2.126044988632202
                        },
                        "text": "Sounds good. Okay. So, Matt, you have Coloulston Lovelin in at number nine. Eight. Eight."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.190211296081543,
                            "neutral": -3.108391284942627,
                            "positive": -2.0669918060302734
                        },
                        "text": "oh he's tight end 12 again like it could easily be love at 12 but anyways who's your sixth through 12. All right 6 through 12 I went uh Travis Kelce Sam Sam LePorta at seven at eight I went Colston Loveland. Whoa. Yeah."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.059880256652832,
                            "neutral": -1.5563716888427734,
                            "positive": -0.6400169730186462
                        },
                        "text": "And I think they're going to try to establish that kind of offense pretty much throughout the entire year. And that that kind of stuff breeds, I think, or it lends itself to getting the tight ends specifically involved quickly and early. And I think that's kind of gonna kind of snowball into Coulson Lovelin getting a lot of targets and then getting a lot of confidence. And once you have that kind of stuff established and the kind of chemistry established with the quarterback, hey, I know you're going to be here when when you're supposed to be and I can let it rip and you're going to make that catch and get me yards after the catch, which is something Coulson Lovelin is very good at. I think I think it's going to be kind of a glove inhand fit with with Coulson Lovelin, the young quarterback, and this offense."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.245667934417725,
                            "neutral": -3.171156883239746,
                            "positive": -1.1166404485702515
                        },
                        "text": "And that that kind of stuff breeds, I think, or it lends itself to getting the tight ends specifically involved quickly and early. And I think that's kind of gonna kind of snowball into Coulson Lovelin getting a lot of targets and then getting a lot of confidence. And once you have that kind of stuff established and the kind of chemistry established with the quarterback, hey, I know you're going to be here when when you're supposed to be and I can let it rip and you're going to make that catch and get me yards after the catch, which is something Coulson Lovelin is very good at. I think I think it's going to be kind of a glove inhand fit with with Coulson Lovelin, the young quarterback, and this offense. I kind of felt that way about Tyler Warren."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4723086",
                "sentiment_consensus": {
                    "negative": -4.028731435537338,
                    "neutral": -2.7854147478938103,
                    "positive": -2.1328845396637917
                },
                "status": "perfect match",
                "transcript_name": "Colston Love"
            },
            "DJ Johnson": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.951970338821411,
                            "neutral": -2.087329864501953,
                            "positive": -2.084657669067383
                        },
                        "text": "Yeah. I think, uh, you know, obviously this is a very crowded situation. Um, so that's going to be I think the biggest hurdle is to to get over is is to get the targets, but we've seen obviously rookies make a big impact in Ben Johnson's offense in the past. Sam Sam LePorta comes directly to mind his rookie year when he finished as I think tight end two or three. Um I can't remember it was he was tight end one at one point"
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4240623",
                "sentiment_consensus": {
                    "negative": -2.951970338821411,
                    "neutral": -2.087329864501953,
                    "positive": -2.084657669067383
                },
                "status": "best of multiple matches",
                "transcript_name": "Ben Johnson's"
            },
            "DJ Moore": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.527363300323486,
                            "neutral": -3.9200446605682373,
                            "positive": -3.111210346221924
                        },
                        "text": "That makes sense. So, you but you still haven't finished as tight end eight amongst such a crowded room of weapons here. DJ Moore, uh, Romo Dunay, the the staff has been raving about Luther Burton over the last two weeks. So, how does how does Colston Lovelin carve out a path in a 2025 season as a rookie tight end? Yeah."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "3915416",
                "sentiment_consensus": {
                    "negative": -4.527363300323486,
                    "neutral": -3.9200446605682373,
                    "positive": -3.111210346221924
                },
                "status": "perfect match",
                "transcript_name": "DJ Moore"
            },
            "Dalton Kincaid": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.401112079620361,
                            "neutral": -2.7727463245391846,
                            "positive": -1.5784351825714111
                        },
                        "text": "yes it's because they paid clear Shakir they didn't even pay him wide receiver one number they paid him wide receiver two to money and that's what Cleo Shakare really wins. So like does Keon Coleman step up in as the number one weapon in this offense or is it Dalton Kincaid? I'm gonna put my money on Dalton Kincaid in that manner and because if it is Khalil Shakir then we're just looking at lackluster passing game as it is as they spread around. I think for me even though he's tight end 26 last year um I think he has a chance to slide into that number one target role."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.0085530281066895,
                            "neutral": -2.526048183441162,
                            "positive": -1.2460927963256836
                        },
                        "text": "and that's what Cleo Shakare really wins. So like does Keon Coleman step up in as the number one weapon in this offense or is it Dalton Kincaid? I'm gonna put my money on Dalton Kincaid in that manner and because if it is Khalil Shakir then we're just looking at lackluster passing game as it is as they spread around. I think for me even though he's tight end 26 last year um I think he has a chance to slide into that number one target role. So yes, am I being biased here?"
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -2.5314836502075195,
                            "neutral": -4.487401008605957,
                            "positive": -2.6904263496398926
                        },
                        "text": "Hunter Henry, I was like, dude, a very clear path for him to be the number two target there. Zach Ertz was another guy getting in there. I settle Dalton Kincaid. I think it's pretty clear and obvious this is a player, former first round pick, enters year three year. This is going to be his make or break year."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.0576446056365967,
                            "neutral": -1.7980033159255981,
                            "positive": -2.227235794067383
                        },
                        "text": "So, we just picked a different rookie tight end together. Mark Andrews at 11. And I have Dalton Kincaid at 12. Makes sense. Yeah."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4385690",
                "sentiment_consensus": {
                    "negative": -3.4996983408927917,
                    "neutral": -2.8960497081279755,
                    "positive": -1.9355475306510925
                },
                "status": "perfect match",
                "transcript_name": "Dalton Kincaid"
            },
            "Daniel Jones": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.019043922424316,
                            "neutral": -3.1435117721557617,
                            "positive": -1.49488365650177
                        },
                        "text": "This is offense. I think they're going to want to keep the ball everything short and sweet. Help Daniel Jones out on his roll out who's the athletic tight end. And I think they're going to find ways to make sure that he's either the first or second look in this offense. So, for me, I think Tyler Warren, just because of target share alone, how many catches he's going to get this year, is going to finish as a tight end one."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "3917792",
                "sentiment_consensus": {
                    "negative": -4.019043922424316,
                    "neutral": -3.1435117721557617,
                    "positive": -1.49488365650177
                },
                "status": "perfect match",
                "transcript_name": "Daniel Jones"
            },
            "David Agoha": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.7558398246765137,
                            "neutral": -1.7631596326828003,
                            "positive": -0.9761319756507874
                        },
                        "text": "T.J. Hockenson, but like I have a guy that is I am zeroed in on that I think will finish um in that tier. And I' I've said on our uh nerd herd show like has a chance if there's one tight end that could break the mold of these three guys. This is the guy who I believe it is and it's my tight end four, David and David Njoku. Okay. That I mean"
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.9969406127929688,
                            "neutral": -2.61112642288208,
                            "positive": -3.05772066116333
                        },
                        "text": "It's just not pos it's literally not possible for you to break that tier. So like my suggestion was like, \"Hey, move off of Sam LePorta for like even like a guy like in David Njoku extender plus, right? Because you could probably get David and David Njoku plus a first uh this year.\" And just imagine if you got you sold David Sam LePorta for David and David Njoku in like 111 and now you can sit there either with Sam LePorta and like Caleb Johnson. Sam Sam or I'm sorry um David and David Njoku."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.483930826187134,
                            "neutral": -2.082951068878174,
                            "positive": -2.56388258934021
                        },
                        "text": "So like my suggestion was like, \"Hey, move off of Sam LePorta for like even like a guy like in David Njoku extender plus, right? Because you could probably get David and David Njoku plus a first uh this year.\" And just imagine if you got you sold David Sam LePorta for David and David Njoku in like 111 and now you can sit there either with Sam LePorta and like Caleb Johnson. Sam Sam or I'm sorry um David and David Njoku. Yeah, David and David Njoku and Caleb Johnson, RJ Harvey, Colston Love, another tight end, a Jackson Dart."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.144225835800171,
                            "neutral": -2.0838279724121094,
                            "positive": -2.4394114017486572
                        },
                        "text": "Because you could probably get David and David Njoku plus a first uh this year.\" And just imagine if you got you sold David Sam LePorta for David and David Njoku in like 111 and now you can sit there either with Sam LePorta and like Caleb Johnson. Sam Sam or I'm sorry um David and David Njoku. Yeah, David and David Njoku and Caleb Johnson, RJ Harvey, Colston Love, another tight end, a Jackson Dart. like and I feel much more comfortable with that combination because I'm with you Matt"
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.9120774269104004,
                            "neutral": -2.068632125854492,
                            "positive": -3.548757553100586
                        },
                        "text": "And just imagine if you got you sold David Sam LePorta for David and David Njoku in like 111 and now you can sit there either with Sam LePorta and like Caleb Johnson. Sam Sam or I'm sorry um David and David Njoku. Yeah, David and David Njoku and Caleb Johnson, RJ Harvey, Colston Love, another tight end, a Jackson Dart. like and I feel much more comfortable with that combination because I'm with you Matt like as it's going to take another receiver to leave that for him to get into that situation"
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.982145309448242,
                            "neutral": -3.68613862991333,
                            "positive": -1.4347740411758423
                        },
                        "text": "I have got him at tight end five I'm sure for very similar reasons. Um and this this I literally did a video like two months ago of like the the the surprise players that could finish number one overall and and David and David Njoku was my guy for that. The easiest thing to do is just look at what he did with Joe Flacco before. That's it, man."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.2135305404663086,
                            "neutral": -2.5849485397338867,
                            "positive": -2.8483476638793945
                        },
                        "text": "We want to see Evan Engram in that role and I do predict him to be there but it's not 100% for me and with addition of having Courtland Sun. I think if if I knew that Joe Flacco was going to be there and be the starter all year round all year, I would say for sure and David and David Njoku over Evan Engram. I just I think the path that the Browns are on in my opinion is hey we're going to start the year with Joe Flacco if things go south and they have a very hard schedule kind of upfront."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -4.245079040527344,
                            "neutral": -2.239959716796875,
                            "positive": -2.7535343170166016
                        },
                        "text": "I think they're such different players that if they if he does start to see more snaps, it's because they're running two or two tight end likely. He's getting Isa like I think that's the case. I don't think it's at the expense of David and David Njoku. And they even talked about uh I think it was the tight end's coach that came out and said like, \"Yes, they're both tight ends, but they are extremely different players in the way that they play the game, and we want to utilize both of those skill sets. They're gonna listen, the Browns are going to run a lot of 12 personnel regardless.\""
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.1277995109558105,
                            "neutral": -1.8090523481369019,
                            "positive": -2.071448564529419
                        },
                        "text": "They're gonna listen, the Browns are going to run a lot of 12 personnel regardless.\" So, yeah. So, I have David and David Njoku at four. Um Garrett, you have him at four. Matt, you said I had him at five."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -1.944718360900879,
                            "neutral": -3.105588436126709,
                            "positive": -1.6359256505966187
                        },
                        "text": "So that's why I got him at number four. For what it's worth, I I kind of have a tier for me. David and David Njoku is kind of in his own tier after George Kittle and then five through nine are who's the last guy left like whoever is has the lowest ADP the guy that's available then I'll take them if I don't if I'm not able to get five through seven. So, I mean I mean I don't have I can't find Evan Engram right here, but we're like one year removed from him being bananas and I could and that's why that's why I was gonna go off of Matt like so when you look at tight Evan Engram what he can do when the target shares there"
                    }
                ],
                "most_frequent_label": "neutral",
                "player_id": "5144941",
                "sentiment_consensus": {
                    "negative": -3.480628728866577,
                    "neutral": -2.4035384893417358,
                    "positive": -2.3329934418201446
                },
                "status": "best of multiple matches",
                "transcript_name": "David"
            },
            "David Njoku": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.5901637077331543,
                            "neutral": -2.0227973461151123,
                            "positive": -0.7728191018104553
                        },
                        "text": "T.J. Hockenson, but like I have a guy that is I am zeroed in on that I think will finish um in that tier. And I' I've said on our uh nerd herd show like has a chance if there's one tight end that could break the mold of these three guys. This is the guy who I believe it is and it's my tight end four, David and David Njoku. Okay. That I mean"
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.7812118530273438,
                            "neutral": -2.6822571754455566,
                            "positive": -2.583963394165039
                        },
                        "text": "And we've made and that was my point about selling him too like hey man like he's now the number three target in that offense and you can't be an elite tight end if that's how you're going to operate. It's just not pos it's literally not possible for you to break that tier. So like my suggestion was like, \"Hey, move off of Sam LePorta for like even like a guy like in David Njoku extender plus, right? Because you could probably get David and David Njoku plus a first uh this year.\" And just imagine if you got you sold David Sam LePorta for David and David Njoku in like 111 and now you can sit there either with Sam LePorta and like Caleb Johnson."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.343975782394409,
                            "neutral": -2.57954478263855,
                            "positive": -2.5244574546813965
                        },
                        "text": "Uh um a Dillon Gabriel obviously kind of earned the backup role there after this last performance um in everyone's eyes here. He can operate this offense. I I think personally there probably wouldn't be I mean there's going to be a drop off from Joe Flacco to anybody else on the roster, but I think he can operate the offense and and kind of support a guy like David Jok. So, I feel good about him being there and kind of being the number two guy. And number number one, uh, I can't remember what the other question was."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.455173492431641,
                            "neutral": -2.9090209007263184,
                            "positive": -2.63093900680542
                        },
                        "text": "It's just not pos it's literally not possible for you to break that tier. So like my suggestion was like, \"Hey, move off of Sam LePorta for like even like a guy like in David Njoku extender plus, right? Because you could probably get David and David Njoku plus a first uh this year.\" And just imagine if you got you sold David Sam LePorta for David and David Njoku in like 111 and now you can sit there either with Sam LePorta and like Caleb Johnson. Sam Sam or I'm sorry um David and David Njoku."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.468234539031982,
                            "neutral": -2.9440979957580566,
                            "positive": -2.370109796524048
                        },
                        "text": "So, for me, I'm with you. It's why I have him at five. I I couldn't get ahead of David Njoku because David Njoku's to me is a little bit more clear-cut. We want to see Evan Engram in that role and I do predict him to be there but it's not 100% for me and with addition of having Courtland Sun."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -4.382195472717285,
                            "neutral": -2.28359055519104,
                            "positive": -2.3040685653686523
                        },
                        "text": "So like my suggestion was like, \"Hey, move off of Sam LePorta for like even like a guy like in David Njoku extender plus, right? Because you could probably get David and David Njoku plus a first uh this year.\" And just imagine if you got you sold David Sam LePorta for David and David Njoku in like 111 and now you can sit there either with Sam LePorta and like Caleb Johnson. Sam Sam or I'm sorry um David and David Njoku. Yeah, David and David Njoku and Caleb Johnson, RJ Harvey, Colston Love, another tight end, a Jackson Dart."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.2495484352111816,
                            "neutral": -1.5513637065887451,
                            "positive": -1.9977113008499146
                        },
                        "text": "like you're getting him in the eighth round. So I think that's just crazy good value. It's why I'm willing to gamble on the George Kittle because if I miss out I'm totally comfortable getting in David Njoku. He mentioned and in total last year he averaged I think about 13 point 13 13.5 points per game in PPR leagues. He missed five games last year, still finishes tight end 10 uh overall."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.984480857849121,
                            "neutral": -3.8503224849700928,
                            "positive": -1.197012186050415
                        },
                        "text": "I have got him at tight end five I'm sure for very similar reasons. Um and this this I literally did a video like two months ago of like the the the surprise players that could finish number one overall and and David and David Njoku was my guy for that. The easiest thing to do is just look at what he did with Joe Flacco before. That's it, man."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -4.0726423263549805,
                            "neutral": -2.54004168510437,
                            "positive": -2.7797045707702637
                        },
                        "text": "We want to see Evan Engram in that role and I do predict him to be there but it's not 100% for me and with addition of having Courtland Sun. I think if if I knew that Joe Flacco was going to be there and be the starter all year round all year, I would say for sure and David and David Njoku over Evan Engram. I just I think the path that the Browns are on in my opinion is hey we're going to start the year with Joe Flacco if things go south and they have a very hard schedule kind of upfront."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.7342562675476074,
                            "neutral": -2.2051775455474854,
                            "positive": -1.9318479299545288
                        },
                        "text": "Because you could probably get David and David Njoku plus a first uh this year.\" And just imagine if you got you sold David Sam LePorta for David and David Njoku in like 111 and now you can sit there either with Sam LePorta and like Caleb Johnson. Sam Sam or I'm sorry um David and David Njoku. Yeah, David and David Njoku and Caleb Johnson, RJ Harvey, Colston Love, another tight end, a Jackson Dart. like and I feel much more comfortable with that combination because I'm with you Matt"
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -4.028870105743408,
                            "neutral": -2.0252790451049805,
                            "positive": -2.4209065437316895
                        },
                        "text": "And just imagine if you got you sold David Sam LePorta for David and David Njoku in like 111 and now you can sit there either with Sam LePorta and like Caleb Johnson. Sam Sam or I'm sorry um David and David Njoku. Yeah, David and David Njoku and Caleb Johnson, RJ Harvey, Colston Love, another tight end, a Jackson Dart. like and I feel much more comfortable with that combination because I'm with you Matt like as it's going to take another receiver to leave that for him to get into that situation"
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -4.19856071472168,
                            "neutral": -2.2734363079071045,
                            "positive": -2.689121723175049
                        },
                        "text": "I think they're such different players that if they if he does start to see more snaps, it's because they're running two or two tight end likely. He's getting Isa like I think that's the case. I don't think it's at the expense of David and David Njoku. And they even talked about uh I think it was the tight end's coach that came out and said like, \"Yes, they're both tight ends, but they are extremely different players in the way that they play the game, and we want to utilize both of those skill sets. They're gonna listen, the Browns are going to run a lot of 12 personnel regardless.\""
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.333134651184082,
                            "neutral": -1.8822160959243774,
                            "positive": -2.0306200981140137
                        },
                        "text": "They're gonna listen, the Browns are going to run a lot of 12 personnel regardless.\" So, yeah. So, I have David and David Njoku at four. Um Garrett, you have him at four. Matt, you said I had him at five."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -1.69831383228302,
                            "neutral": -2.663837194442749,
                            "positive": -1.1343010663986206
                        },
                        "text": "So that's why I got him at number four. For what it's worth, I I kind of have a tier for me. David and David Njoku is kind of in his own tier after George Kittle and then five through nine are who's the last guy left like whoever is has the lowest ADP the guy that's available then I'll take them if I don't if I'm not able to get five through seven. So, I mean I mean I don't have I can't find Evan Engram right here, but we're like one year removed from him being bananas and I could and that's why that's why I was gonna go off of Matt like so when you look at tight Evan Engram what he can do when the target shares there"
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.6139960289001465,
                            "neutral": -2.8104987144470215,
                            "positive": -0.7707876563072205
                        },
                        "text": "Trey Trey McBride, you can argue is number one target with Kyler Murray in that offense. George Kittle, if he's not number one, he's 1B, right? I think the same thing in David Njoku falls into the same line as if he's not 1A, he is 1B. So that's what's going to propel him. I mean last year he saw the third most targets per game uh close to nine as it was."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "3123076",
                "sentiment_consensus": {
                    "negative": -3.6623172044754027,
                    "neutral": -2.4815654357274375,
                    "positive": -2.0092246929804483
                },
                "status": "perfect match",
                "transcript_name": "David Njoku"
            },
            "DeVonta Smith": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.576779365539551,
                            "neutral": -2.620028257369995,
                            "positive": -1.2019832134246826
                        },
                        "text": "It just comes down to the situation. Exactly. I feel like Dvonte Smith, like I said last year, like I love Devonte Smith. I love his talent. It's just where the target shares where the opportunities, right?"
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4241478",
                "sentiment_consensus": {
                    "negative": -4.576779365539551,
                    "neutral": -2.620028257369995,
                    "positive": -1.2019832134246826
                },
                "status": "perfect match",
                "transcript_name": "Dvonte Smith"
            },
            "DeWayne McBride": {
                "average_label": "neutral",
                "detailed_sentiment": [
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.472952365875244,
                            "neutral": -1.0478355884552002,
                            "positive": -1.4574885368347168
                        },
                        "text": "But I mean, you know, it's it is what it is. These guys, you can't go wrong with either one of these. I ended up going Brock Bowers George Kittle Trey McBride is on the same page. Yeah, we're on the same page. Here's here's my one beef with this right now."
                    }
                ],
                "most_frequent_label": "neutral",
                "player_id": "4430388",
                "sentiment_consensus": {
                    "negative": -3.472952365875244,
                    "neutral": -1.0478355884552002,
                    "positive": -1.4574885368347168
                },
                "status": "best of multiple matches",
                "transcript_name": "KD McBride"
            },
            "Deebo Samuel": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.11039400100708,
                            "neutral": -2.635892391204834,
                            "positive": -1.744547724723816
                        },
                        "text": "So, I I almost got him in. Um, so did I. I wanted to. If it wasn't for Debo Samuel, Zach Ertz would have been higher. That That's been on my mind. But I I"
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "3126486",
                "sentiment_consensus": {
                    "negative": -3.11039400100708,
                    "neutral": -2.635892391204834,
                    "positive": -1.744547724723816
                },
                "status": "perfect match",
                "transcript_name": "Debo Samuel"
            },
            "Deshaun Watson": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.4440367221832275,
                            "neutral": -1.9984132051467896,
                            "positive": -1.6920264959335327
                        },
                        "text": "You know, obviously we only saw one preseason kind of series with those two guys on the field and it was a a misfire on the target. Um as far as uh Jerry Jeudy and and Joe Flacco, but I I think I think David Njoku and him have proven over time that you know obviously they have a really really strong connection. And even any quarterback not named Deshun Watson to start and finish a game last year, he averaged over 15 points a game. Yeah. So, he's still putting up borderline number one overall tight end numbers just with any random quarterback last year."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "3122840",
                "sentiment_consensus": {
                    "negative": -2.4440367221832275,
                    "neutral": -1.9984132051467896,
                    "positive": -1.6920264959335327
                },
                "status": "perfect match",
                "transcript_name": "Deshun Watson"
            },
            "Dillon Gabriel": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.3460893630981445,
                            "neutral": -2.981750011444092,
                            "positive": -2.95279598236084
                        },
                        "text": "But I think the Vikings game is where like that's where we're going to start to pivot. And then you're right. I think they're going to want to see what they have in Dillon Gabriel because like if they they spend a third round pick on him. I I've been kind of hammering this all along, right? Like everybody's been I've been saying on the show like during rookie stuff like people are drafting Shadur Sanders way ahead of Dillon Gabriel but like the Browns love Dillon Gabriel and they've done that throughout camp they've done it through um this point they just named today Dillon Gabriel the number two quarterback."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -4.839697360992432,
                            "neutral": -1.8313874006271362,
                            "positive": -2.2609446048736572
                        },
                        "text": "I think they're going to want to see what they have in Dillon Gabriel because like if they they spend a third round pick on him. I I've been kind of hammering this all along, right? Like everybody's been I've been saying on the show like during rookie stuff like people are drafting Shadur Sanders way ahead of Dillon Gabriel but like the Browns love Dillon Gabriel and they've done that throughout camp they've done it through um this point they just named today Dillon Gabriel the number two quarterback. I mean I said it when they drafted him that dude can run the offense right now and he looks like he can run the offense right now. He looks good."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.968393325805664,
                            "neutral": -3.605778694152832,
                            "positive": -1.7643611431121826
                        },
                        "text": "Just let's move on. I threw myself off with the A in one. I think if you bring in a guy like Dillon Gabriel, they're going to try and keep things short and sweet for him to start, right? Like a lot of quick things like in the flat over the I remembered one. Harold Fannon looked good in this past few seasons and and with David Njoku coming into a contract year, is there any thought that he chips away and and starts kind of getting a bigger piece of that pie?"
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -5.123305797576904,
                            "neutral": -1.9075318574905396,
                            "positive": -2.2064619064331055
                        },
                        "text": "First a question a and then I'm gonna go to one. Uh um a Dillon Gabriel obviously kind of earned the backup role there after this last performance um in everyone's eyes here. He can operate this offense. I I think personally there probably wouldn't be I mean there's going to be a drop off from Joe Flacco to anybody else on the roster, but I think he can operate the offense and and kind of support a guy like David Jok."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4427238",
                "sentiment_consensus": {
                    "negative": -4.319371461868286,
                    "neutral": -2.58161199092865,
                    "positive": -2.2961409091949463
                },
                "status": "perfect match",
                "transcript_name": "Dillon Gabriel"
            },
            "Dorian Thompson-Robinson": {
                "average_label": "negative",
                "detailed_sentiment": [
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -1.180815577507019,
                            "neutral": -3.2872157096862793,
                            "positive": -2.072420120239258
                        },
                        "text": "So, he's still putting up borderline number one overall tight end numbers just with any random quarterback last year. Jameus Winston, uh, Thomas, uh, I even forget his name now. Thompson Robinson, Dorian Thompson Robinson, the worst quarterback I've ever seen play in. Yeah, terrible. Uh, like it didn't didn't matter who it was."
                    }
                ],
                "most_frequent_label": "negative",
                "player_id": "4367178",
                "sentiment_consensus": {
                    "negative": -1.180815577507019,
                    "neutral": -3.2872157096862793,
                    "positive": -2.072420120239258
                },
                "status": "perfect match",
                "transcript_name": "Thompson Robinson"
            },
            "Drake London": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.339279651641846,
                            "neutral": -2.306953191757202,
                            "positive": -2.2799057960510254
                        },
                        "text": "Like, this is this is a must. He's the number two option in this offense. I mean, it is it's Drake London to be Well, right. I'm sorry. besides Bijan Robinson, who is actually the number two."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4426502",
                "sentiment_consensus": {
                    "negative": -4.339279651641846,
                    "neutral": -2.306953191757202,
                    "positive": -2.2799057960510254
                },
                "status": "perfect match",
                "transcript_name": "Drake London"
            },
            "Evan Engram": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.5149197578430176,
                            "neutral": -3.124201774597168,
                            "positive": -2.454225540161133
                        },
                        "text": "I think even though I'm the one like like proponent of him and I'm down on him, but I would still rather just like the the tight that position's so elusive. and he's still so young. I would rather just gamble on the upside and like and then hope that like he doesn't work out in like Atlanta and he goes somewhere else and like just like Evan Engram it was great, right? And he has so much time like dude he could be a dud for two more years and be as year 27 still have three or four guys. We've been wanting a guy to go here forever."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.4934585094451904,
                            "neutral": -2.913604497909546,
                            "positive": -3.009012460708618
                        },
                        "text": "Do you want six through 12? Just remind a little recap on that. We're not going to talk about the six player but just kind of so six through 12 T.J. Hockenson then Sam Sam LePorta, Evan Engram, Tucker Tucker Kraft at nine. At 10 I have Mark Andrews. At 11 I have Hunter Henry."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.5500221252441406,
                            "neutral": -2.033714771270752,
                            "positive": -2.624664068222046
                        },
                        "text": "Uh and then for me, I have at seven, I have Sam LePorta. Yep. And then which is So do I. pretty low actually for well for ADP I'm saying uh overall ADP he's the fourth tight end off the board and when you look at Sam LePorta he's the 51st guy off the board then when you get into a lot of the guys that we're talking about Evan Engram David and David Njoku Tucker Tucker Kraft Evan Engram's 80 and David Njoku is 82 Tucker Tucker Kraft's 108 um so"
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -4.366140365600586,
                            "neutral": -3.4010984897613525,
                            "positive": -4.668675899505615
                        },
                        "text": "And obviously, it's on the back of, you know, all the talk this whole offseason about Tron Peyton wanting to get a Evan Engram and then him going out and kind of finding his guy, going out and saying, \"Hey, this is this is the guy that I want.\" Him and R.J. Harvey, which I think R.J. Harvey is going to have a role this year. I don't know that it's going to be as the Evan Engram yet. You know, I think that's kind of one of those things that he'll have to grow into if he if he does become the long term. And RJ Harvey's not even going to play on third downs."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.0036673545837402,
                            "neutral": -1.5732413530349731,
                            "positive": -1.254942774772644
                        },
                        "text": "like So I had So who's your six then? Because we have our Oh, yeah. So you have I think my Evan Engram was or no? Oh yeah, Evan Engram four Jou five and then Travis G. So who did you have?"
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.356133222579956,
                            "neutral": -3.287435531616211,
                            "positive": -3.1538734436035156
                        },
                        "text": "It's why I have him at five. I I couldn't get ahead of David Njoku because David Njoku's to me is a little bit more clear-cut. We want to see Evan Engram in that role and I do predict him to be there but it's not 100% for me and with addition of having Courtland Sun. I think if if I knew that Joe Flacco was going to be there and be the starter all year round all year, I would say for sure and David and David Njoku over Evan Engram."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.914172649383545,
                            "neutral": -1.583001732826233,
                            "positive": -1.9773603677749634
                        },
                        "text": "Because we have our Oh, yeah. So you have I think my Evan Engram was or no? Oh yeah, Evan Engram four Jou five and then Travis G. So who did you have? I have T.J. Hockenson at six."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.99485445022583,
                            "neutral": -2.5955424308776855,
                            "positive": -2.8226065635681152
                        },
                        "text": "We want to see Evan Engram in that role and I do predict him to be there but it's not 100% for me and with addition of having Courtland Sun. I think if if I knew that Joe Flacco was going to be there and be the starter all year round all year, I would say for sure and David and David Njoku over Evan Engram. I just I think the path that the Browns are on in my opinion is hey we're going to start the year with Joe Flacco if things go south and they have a very hard schedule kind of upfront."
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": 0.2772282063961029,
                            "neutral": -3.76542329788208,
                            "positive": -2.3021326065063477
                        },
                        "text": "Now to be fair we saw a guy in the same exact mold, right? guy we already talked about, Ev. Evan Engram came out, same gang busters. Same exact thing. Same exact thing and then fell off the face of the for the New York Giants."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -1.9773157835006714,
                            "neutral": -3.394589900970459,
                            "positive": -1.1860989332199097
                        },
                        "text": "David and David Njoku is kind of in his own tier after George Kittle and then five through nine are who's the last guy left like whoever is has the lowest ADP the guy that's available then I'll take them if I don't if I'm not able to get five through seven. So, I mean I mean I don't have I can't find Evan Engram right here, but we're like one year removed from him being bananas and I could and that's why that's why I was gonna go off of Matt like so when you look at tight Evan Engram what he can do when the target shares there and I'm agree with you. I think he does play that Evan Engram role."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -4.6930084228515625,
                            "neutral": -1.756859302520752,
                            "positive": -2.243386745452881
                        },
                        "text": "Can can catch some passes. I don't think he falls into the Evan Engram kind of role as much as he is kind of just like an every down type of guy at this point in his career after all the injuries. So Evan Engram is left, you know, as the guy that they're going to kind of use as this moving chest piece. And I think Shawn Peyton has proven in the past that he he really likes to target the tight end and really likes to get those guys involved. So that's why I got him at number four."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.478461742401123,
                            "neutral": -3.6273086071014404,
                            "positive": -0.426741361618042
                        },
                        "text": "Yeah, he's super talented, man. And and you know, given, you know, that some of these guys, you know, George Kittle's a little bit older. Evan Engram's a little bit older. Travis Kelce obviously a little bit older. He's a guy that we're going to be having to have the conversation, you know, is he this next guy that's going to be able to get a tier if if Green Bay's wide receivers kind of start to dissipate in the next couple of seasons or even just solidify who's who and well, what's what's the roles there?"
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.092147350311279,
                            "neutral": -3.284470558166504,
                            "positive": -2.4209485054016113
                        },
                        "text": "So even though I have T.J. Hockenson at six, I'm with you in the tier group. Five through like eight to me are pretty close. I like I almost want to put Evan Engram in his own tier because I'm with you Matt like how I believe he's going to play that Evan Engram role. Once I know that for sure, he's locked in there. And that's why I said like six through eight I feel more comfortable interchanging."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.1092193126678467,
                            "neutral": -3.4369473457336426,
                            "positive": -1.5734061002731323
                        },
                        "text": "For what it's worth, I I kind of have a tier for me. David and David Njoku is kind of in his own tier after George Kittle and then five through nine are who's the last guy left like whoever is has the lowest ADP the guy that's available then I'll take them if I don't if I'm not able to get five through seven. So, I mean I mean I don't have I can't find Evan Engram right here, but we're like one year removed from him being bananas and I could and that's why that's why I was gonna go off of Matt like so when you look at tight Evan Engram what he can do when the target shares there and I'm agree with you."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.264642715454102,
                            "neutral": -1.973245620727539,
                            "positive": -1.4767389297485352
                        },
                        "text": "So, who do you have at four? I got the Evan Engram, man. Evan Engram. That's what I have at five. Yeah."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "3051876",
                "sentiment_consensus": {
                    "negative": -2.9687290370464323,
                    "neutral": -2.783379014333089,
                    "positive": -2.239654286702474
                },
                "status": "perfect match",
                "transcript_name": "Evan Engram"
            },
            "Garrett Wilson": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.9412615299224854,
                            "neutral": -1.6221678256988525,
                            "positive": -0.43999916315078735
                        },
                        "text": "I mean, I can see that, too. Yeah, no doubt. Nobody there to catch the football outside of Garrett Wilson. Wilson and him. Baron."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4569618",
                "sentiment_consensus": {
                    "negative": -3.9412615299224854,
                    "neutral": -1.6221678256988525,
                    "positive": -0.43999916315078735
                },
                "status": "perfect match",
                "transcript_name": "Garrett Wilson"
            },
            "George Kittle": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.6760382652282715,
                            "neutral": -2.0477237701416016,
                            "positive": -2.5810775756835938
                        },
                        "text": "We've been talking about him a lot, so it doesn't surprise me. Yeah. So, like if I miss out on George Kittle to end round three, I have a very clear-cut draw who a guy who won't even go as tight end four because Sam LePorta is going to usually go tight end four there. T.J. Hockenson, but like I have a guy that is I am zeroed in on that I think will finish um in that tier. And I' I've said on our uh nerd herd show like has a chance if there's one tight end that could break the mold of these three guys."
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -1.7312031984329224,
                            "neutral": -2.8620595932006836,
                            "positive": -4.302116394042969
                        },
                        "text": "I love him. I was like, uh, number nine, Tucker Tucker Kraft. Now, now we see why George Kittle is below him in our in our GM tool. That might just be a function of We'll talk about that later. Um, Mark 10 10 Mark Andrews, 11 Zach Ertz."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.539957523345947,
                            "neutral": -3.613607406616211,
                            "positive": -2.5269346237182617
                        },
                        "text": "Which is again either way, but you could mix them up, but I I do have a preference. I really wanted to put George Kittle as my tight end. I wanted to I didn't, but I I wanted to, but then I was like, dude, Jacobe Myers is always being already being whiny about his time over there. Like, dude, Brock Bowers is again all the targets."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.3616552352905273,
                            "neutral": -2.446183204650879,
                            "positive": -1.8585244417190552
                        },
                        "text": "Every reddraft league I've done so far, every best ball draft I've done, I let everybody jump on Brock I wait for Brock Bowers to go. Trey McBride goes like real quick after and I make sure I get George Kittle because that is where the value is. instead of taking Brock Bowers and, you know, missing out on that elite other running back or top tier receiver, I'm like, dude, I'm just gonna get George Kittle. Let me ask you this, though. You're sitting there at the last pick of the draft."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.794804573059082,
                            "neutral": -2.61110782623291,
                            "positive": -1.8743380308151245
                        },
                        "text": "That's the value. Every reddraft league I've done so far, every best ball draft I've done, I let everybody jump on Brock I wait for Brock Bowers to go. Trey McBride goes like real quick after and I make sure I get George Kittle because that is where the value is. instead of taking Brock Bowers and, you know, missing out on that elite other running back or top tier receiver, I'm like, dude, I'm just gonna get George Kittle. Let me ask you this, though."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.943540573120117,
                            "neutral": -2.5902838706970215,
                            "positive": -2.230069160461426
                        },
                        "text": "Like, dude, Brock Bowers is again all the targets. Number one, all the targets. So, Brock Bowers, he was tight end one last year, but on points per game basis, George Kittle was tight end one. True. Just mind you that."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.607614755630493,
                            "neutral": -1.4976201057434082,
                            "positive": -2.4520463943481445
                        },
                        "text": "True. Just mind you that. So Brock Bowers one, George Kittle two, Trey Trey McBride three. I just I went chalky chalk. I went Brock Bowers Trey Trey McBride Trey McBride then George Kittle same as last year's um finish."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.043546199798584,
                            "neutral": -2.967548370361328,
                            "positive": -1.44692862033844
                        },
                        "text": "So that's why I got him at number four. For what it's worth, I I kind of have a tier for me. David and David Njoku is kind of in his own tier after George Kittle and then five through nine are who's the last guy left like whoever is has the lowest ADP the guy that's available then I'll take them if I don't if I'm not able to get five through seven. So, I mean I mean I don't have I can't find Evan Engram right here, but we're like one year removed from him being bananas and I could and that's why that's why I was gonna go off of Matt like so when you look at tight Evan Engram what he can do when the target shares there"
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.017979145050049,
                            "neutral": -3.8888776302337646,
                            "positive": -1.425400733947754
                        },
                        "text": "Obviously, uh you have Brock Bowers is number one target. Trey Trey McBride, you can argue is number one target with Kyler Murray in that offense. George Kittle, if he's not number one, he's 1B, right? I think the same thing in David Njoku falls into the same line as if he's not 1A, he is 1B. So that's what's going to propel him."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.3294320106506348,
                            "neutral": -2.153588056564331,
                            "positive": 1.00429368019104
                        },
                        "text": "It went from seven to five. So he lost two targets per game because Jameson Williams took a big step up. What did we used to talk about with George Kittle? It was like well George Kittle can always he can perform if these other if one of these If one of these two other guys goes down, and it's a very similar thing argument you can make for Sam LePorta. If he if one of those guys goes down and Sam LePorta all of a sudden gets more of the target share because those naturally they're just out of the offense, then yeah, he can bump way the heck up."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "3040151",
                "sentiment_consensus": {
                    "negative": -3.204577147960663,
                    "neutral": -2.667859983444214,
                    "positive": -1.9693142294883728
                },
                "status": "perfect match",
                "transcript_name": "George Kittle"
            },
            "Harold Fannin Jr.": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.8653476238250732,
                            "neutral": -2.877854347229004,
                            "positive": -1.3388198614120483
                        },
                        "text": "I think if you bring in a guy like Dillon Gabriel, they're going to try and keep things short and sweet for him to start, right? Like a lot of quick things like in the flat over the I remembered one. Harold Fannon looked good in this past few seasons and and with David Njoku coming into a contract year, is there any thought that he chips away and and starts kind of getting a bigger piece of that pie? I think they're such different players that if they if he does start to see more snaps, it's because they're running two or two tight end likely. He's getting Isa like I think that's the case."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "5083076",
                "sentiment_consensus": {
                    "negative": -3.8653476238250732,
                    "neutral": -2.877854347229004,
                    "positive": -1.3388198614120483
                },
                "status": "perfect match",
                "transcript_name": "Harold Fannon"
            },
            "Henry Anderson": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.355787754058838,
                            "neutral": -2.1781954765319824,
                            "positive": -1.7521380186080933
                        },
                        "text": "And he's just the most unsexy guy to do it. But if if something goes wonky in my my reddraft leagues or even in my dynasty leagues and I just don't have a tight end, he's the easy like break glass in case of emergency guy because I know he's going to get me eight to nine points a game and twothirds probably get it done. You know, if not a third, a third and fourth would get done for Henry. And and you're right, like I He's another guy I really want to get in."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "2517752",
                "sentiment_consensus": {
                    "negative": -2.355787754058838,
                    "neutral": -2.1781954765319824,
                    "positive": -1.7521380186080933
                },
                "status": "best of multiple matches",
                "transcript_name": "Henry"
            },
            "Hunter Henry": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.333320379257202,
                            "neutral": -3.0927770137786865,
                            "positive": -0.834807813167572
                        },
                        "text": "I still think he's going to be inside the top eight or so at on targets. And I think they're going to be better targets this year. and and Hunter Henry even missed the game. So, it wasn't even like he he played every game. Uh but he was still there."
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -1.3787894248962402,
                            "neutral": -1.8650250434875488,
                            "positive": -2.613297700881958
                        },
                        "text": "So, it wasn't even like he he played every game. Uh but he was still there. 97 targets last year for Hunter Henry. Very very solid number. And he's just the most unsexy guy to do it."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.8312177658081055,
                            "neutral": -4.130796432495117,
                            "positive": -3.7521796226501465
                        },
                        "text": "We're not going to talk about the six player but just kind of so six through 12 T.J. Hockenson then Sam Sam LePorta, Evan Engram, Tucker Tucker Kraft at nine. At 10 I have Mark Andrews. At 11 I have Hunter Henry. And at 12 I have Kyle Pitts. I thought about getting Hunter Henry in there."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -5.033924102783203,
                            "neutral": -4.165515422821045,
                            "positive": -4.2587456703186035
                        },
                        "text": "At 11 I have Hunter Henry. And at 12 I have Kyle Pitts. I thought about getting Hunter Henry in there. I you know it's a weird it's a weird range down there and I was like it is very weird"
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.828094005584717,
                            "neutral": -4.5632452964782715,
                            "positive": -2.4343738555908203
                        },
                        "text": "I'm spread knowing how to hit him. Jake Ferguson has a chance like all those guys are all sitting there. Hunter Henry, I was like, dude, a very clear path for him to be the number two target there. Zach Ertz was another guy getting in there. I settle Dalton Kincaid."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.6987338066101074,
                            "neutral": -2.1780447959899902,
                            "positive": -1.4824990034103394
                        },
                        "text": "Yeah. compared to ADP. And it's the thing what Kyle Pitts cost you compared to what you give Hunter Henry for. It's like or Zach Ertz, you know what I mean? It's like Exactly."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.239469528198242,
                            "neutral": -3.64741849899292,
                            "positive": -0.9041629433631897
                        },
                        "text": "So he's going to be 35. So Garrett, who was your outlier? My weird one was uh Hunter Henry. Hunter Henry. Uh here here's the biggest reason."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.014439105987549,
                            "neutral": -4.184781074523926,
                            "positive": -0.08679328113794327
                        },
                        "text": "So Garrett, who was your outlier? My weird one was uh Hunter Henry. Hunter Henry. Uh here here's the biggest reason. total targets at the tight end position."
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -1.8437376022338867,
                            "neutral": -2.0546460151672363,
                            "positive": -1.9540592432022095
                        },
                        "text": "Uh, some former Rams guy. Okay. There's so many all the like when we talk about all those bunch of guys in the bottom there like a guy in Zachary, it's Hunter Henry. I feel more comfortable about all them than Kyle Pitts. Like I just I'm I'm done until I see it"
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "3046439",
                "sentiment_consensus": {
                    "negative": -3.133525080151028,
                    "neutral": -3.3202499548594155,
                    "positive": -2.0356576815247536
                },
                "status": "perfect match",
                "transcript_name": "Hunter Henry"
            },
            "Isaac TeSlaa": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.8362324237823486,
                            "neutral": -2.9027442932128906,
                            "positive": -2.2377424240112305
                        },
                        "text": "like and I feel much more comfortable with that combination because I'm with you Matt like as it's going to take another receiver to leave that for him to get into that situation and yes they picked up Jameson Williams fifthear option but with how good Isaac Tessa has looked in this offense they spent a third round pick on him there's nothing to believe that if for some reason Jameson Williams leaves that Tesla is not going to literally slide into that Jameson Williams role so those concerns for me is again it's just about value verse production and I love Sam Sam LePorta I really do I think He's an amazing talent."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "5123663",
                "sentiment_consensus": {
                    "negative": -3.8362324237823486,
                    "neutral": -2.9027442932128906,
                    "positive": -2.2377424240112305
                },
                "status": "perfect match",
                "transcript_name": "Isaac Tessa"
            },
            "J.J. McCarthy": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.337122440338135,
                            "neutral": -3.584512233734131,
                            "positive": -1.4845050573349
                        },
                        "text": "And I think he's extremely talented tight end who at one point had my dynasty tight end won overall because how much I loved him. I think that Jordan missing a couple games is enough to really propel him. Now that he's more than a full year removed from his injury, the fact that he's gonna be able to slide in as a number two target in this offense, um I think it'll kind of help propel him, build that rapport, JJ McCarthy, be again, we always talk about these rookie quarterbacks, like always one of their safety nets. It's usually the tight end. I think T.J. Hockenson kind of felt um find himself in that position."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4433970",
                "sentiment_consensus": {
                    "negative": -4.337122440338135,
                    "neutral": -3.584512233734131,
                    "positive": -1.4845050573349
                },
                "status": "best of multiple matches",
                "transcript_name": "JJ McCarthy"
            },
            "J.K. Dobbins": {
                "average_label": "neutral",
                "detailed_sentiment": [
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.855372428894043,
                            "neutral": -1.0568803548812866,
                            "positive": -1.61968195438385
                        },
                        "text": "As it's reported right now. All right. So, I mean, we all know that, you know, JK Dobbins is a talented guy. Can can catch some passes. I don't think he falls into the Evan Engram kind of role as much as he is kind of just like an every down type of guy at this point in his career after all the injuries."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.6095290184020996,
                            "neutral": -2.0336899757385254,
                            "positive": -1.6318068504333496
                        },
                        "text": "Like, you know, it's Yeah, it sounds like his pass blocking is a big concern at this point. So, he'll really need to grow in order to become that kind of guy. JK Dobbins is reported he's the starter. Okay. As it's reported right now."
                    }
                ],
                "most_frequent_label": "neutral",
                "player_id": "4241985",
                "sentiment_consensus": {
                    "negative": -3.2324507236480713,
                    "neutral": -1.545285165309906,
                    "positive": -1.6257444024085999
                },
                "status": "perfect match",
                "transcript_name": "JK Dobbins"
            },
            "Jake Ferguson": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.4469645023345947,
                            "neutral": -3.47796368598938,
                            "positive": -2.1917803287506104
                        },
                        "text": "I think there's a chance for him to be Ferguson. I'm spread knowing how to hit him. Jake Ferguson has a chance like all those guys are all sitting there. Hunter Henry, I was like, dude, a very clear path for him to be the number two target there. Zach Ertz was another guy getting in there."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4242355",
                "sentiment_consensus": {
                    "negative": -3.4469645023345947,
                    "neutral": -3.47796368598938,
                    "positive": -2.1917803287506104
                },
                "status": "perfect match",
                "transcript_name": "Jake Ferguson"
            },
            "Jameis Winston": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.1312074661254883,
                            "neutral": -1.8821581602096558,
                            "positive": -1.104176640510559
                        },
                        "text": "Yeah. So, he's still putting up borderline number one overall tight end numbers just with any random quarterback last year. Jameus Winston, uh, Thomas, uh, I even forget his name now. Thompson Robinson, Dorian Thompson Robinson, the worst quarterback I've ever seen play in. Yeah, terrible."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "2969939",
                "sentiment_consensus": {
                    "negative": -2.1312074661254883,
                    "neutral": -1.8821581602096558,
                    "positive": -1.104176640510559
                },
                "status": "perfect match",
                "transcript_name": "Jameus Winston"
            },
            "Jameson Williams": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -1.8350193500518799,
                            "neutral": -3.0946385860443115,
                            "positive": -2.8857192993164062
                        },
                        "text": "I think he's a very, very talented player. But once again, if this offense just takes a 5% step back, 10% step back. And then if Jameson Williams is actually more involved and takes some of that away, like there's just a lot of little things. They don't have to be huge things, just little things that could pull him back that could all go the wrong way, basically. And Sam LePorta was eight last year."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.540698289871216,
                            "neutral": -3.255399703979492,
                            "positive": -3.252711296081543
                        },
                        "text": "It's just there's only one football and there's only so many targets to go around per year. Yeah. And we saw Jameson Williams clearly establish himself as a number two target at offense. And we've made and that was my point about selling him too like hey man like he's now the number three target in that offense and you can't be an elite tight end if that's how you're going to operate. It's just not pos it's literally not possible for you to break that tier."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.776205539703369,
                            "neutral": -3.8480451107025146,
                            "positive": -2.110802412033081
                        },
                        "text": "Um, and the reason why is I still have some my notes back here from early like six months ago and it says what happened to his targets per game. It went from seven to five. So he lost two targets per game because Jameson Williams took a big step up. What did we used to talk about with George Kittle? It was like well George Kittle can always he can perform if these other if one of these If one of these two other guys goes down, and it's a very similar thing argument you can make for Sam LePorta."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.9619052410125732,
                            "neutral": -3.2788443565368652,
                            "positive": -2.6736884117126465
                        },
                        "text": "like and I feel much more comfortable with that combination because I'm with you Matt like as it's going to take another receiver to leave that for him to get into that situation and yes they picked up Jameson Williams fifthear option but with how good Isaac Tessa has looked in this offense they spent a third round pick on him there's nothing to believe that if for some reason Jameson Williams leaves that Tesla is not going to literally slide into that Jameson Williams role so those concerns for me is again it's just about value verse production and I love Sam Sam LePorta I really do I think He's an amazing talent."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4426388",
                "sentiment_consensus": {
                    "negative": -3.2784571051597595,
                    "neutral": -3.369231939315796,
                    "positive": -2.730730354785919
                },
                "status": "perfect match",
                "transcript_name": "Jameson Williams"
            },
            "Jaxson Dart": {
                "average_label": "neutral",
                "detailed_sentiment": [
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.47654390335083,
                            "neutral": -2.5481984615325928,
                            "positive": -3.4537768363952637
                        },
                        "text": "And just imagine if you got you sold David Sam LePorta for David and David Njoku in like 111 and now you can sit there either with Sam LePorta and like Caleb Johnson. Sam Sam or I'm sorry um David and David Njoku. Yeah, David and David Njoku and Caleb Johnson, RJ Harvey, Colston Love, another tight end, a Jackson Dart. like and I feel much more comfortable with that combination because I'm with you Matt like as it's going to take another receiver to leave that for him to get into that situation"
                    }
                ],
                "most_frequent_label": "neutral",
                "player_id": "4689114",
                "sentiment_consensus": {
                    "negative": -3.47654390335083,
                    "neutral": -2.5481984615325928,
                    "positive": -3.4537768363952637
                },
                "status": "best of multiple matches",
                "transcript_name": "Jackson Dart"
            },
            "Jayden Daniels": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.9870190620422363,
                            "neutral": -2.626145362854004,
                            "positive": -2.2464306354522705
                        },
                        "text": "I just I I I think this is a great offense. Obviously, year two with um Jaden Daniels, I think the whole offense is going to be better and humming and obviously they they got uh Terry in which is I think great news just for this whole kind of thing going on and you know they're they're they brought in Z I think as a guy that they felt familiar with and they drafted Ben Sinnott last year. really hasn't come together for Ben um yet and had a rough camper I heard rather yeah"
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4426348",
                "sentiment_consensus": {
                    "negative": -3.9870190620422363,
                    "neutral": -2.626145362854004,
                    "positive": -2.2464306354522705
                },
                "status": "best of multiple matches",
                "transcript_name": "Jaden Daniels"
            },
            "Jerry Jeudy": {
                "average_label": "negative",
                "detailed_sentiment": [
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": 2.8801755905151367,
                            "neutral": -2.6085338592529297,
                            "positive": -2.289137363433838
                        },
                        "text": "Yeah. But the the guy to own for me in this offense, if I have to pick one, is absolutely David 100%. That's I'm a little bit lower on Jerry Jeudy than probably like I think than Rich because I think it's going to be the David Njoku show. Y it's going to be they're going to be running the heck out of the ball."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.7953310012817383,
                            "neutral": -2.974491596221924,
                            "positive": -1.7276796102523804
                        },
                        "text": "I haven't seen the type of connection. You know, obviously we only saw one preseason kind of series with those two guys on the field and it was a a misfire on the target. Um as far as uh Jerry Jeudy and and Joe Flacco, but I I think I think David Njoku and him have proven over time that you know obviously they have a really really strong connection. And even any quarterback not named Deshun Watson to start and finish a game last year, he averaged over 15 points a game. Yeah."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.065821647644043,
                            "neutral": -2.7109642028808594,
                            "positive": -1.510143756866455
                        },
                        "text": "Did you see all the videos of them in golf carts together having a good time? Like, dude, he's going to be force-fed targets. Like, it I like Jerry Jeudy as well. Yeah. But the the guy to own for me in this offense, if I have to pick one, is absolutely David 100%."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4241463",
                "sentiment_consensus": {
                    "negative": -1.326992352803548,
                    "neutral": -2.7646632194519043,
                    "positive": -1.8423202435175579
                },
                "status": "perfect match",
                "transcript_name": "Jerry Jeudy"
            },
            "Joe Flacco": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -1.4109739065170288,
                            "neutral": -0.9712293744087219,
                            "positive": -1.1413813829421997
                        },
                        "text": "He produced. He produced. So, you have that and you get Joe Flaccco back. Like I I think he's a smash value because his ADP right now in reddraft is tight end ninth off the board and he's going in the 80s overall. So in your traditional 10-man league that's eighth round"
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.400223970413208,
                            "neutral": -1.7065035104751587,
                            "positive": -2.2210474014282227
                        },
                        "text": "Uh um a Dillon Gabriel obviously kind of earned the backup role there after this last performance um in everyone's eyes here. He can operate this offense. I I think personally there probably wouldn't be I mean there's going to be a drop off from Joe Flacco to anybody else on the roster, but I think he can operate the offense and and kind of support a guy like David Jok. So, I feel good about him being there and kind of being the number two guy. And number number one, uh, I can't remember what the other question was."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.1343743801116943,
                            "neutral": -3.7416539192199707,
                            "positive": -2.064878463745117
                        },
                        "text": "I'm sure for very similar reasons. Um and this this I literally did a video like two months ago of like the the the surprise players that could finish number one overall and and David and David Njoku was my guy for that. The easiest thing to do is just look at what he did with Joe Flacco before. That's it, man. That's the easiest thing to do."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.8257369995117188,
                            "neutral": -2.2880773544311523,
                            "positive": -2.1355056762695312
                        },
                        "text": "I think if if I knew that Joe Flacco was going to be there and be the starter all year round all year, I would say for sure and David and David Njoku over Evan Engram. I just I think the path that the Browns are on in my opinion is hey we're going to start the year with Joe Flacco if things go south and they have a very hard schedule kind of upfront. Yeah. If this thing starts going off the rails we have to do our best to see what we have in this third round pick this fifth round pick."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.9575870037078857,
                            "neutral": -3.2973597049713135,
                            "positive": -0.14438557624816895
                        },
                        "text": "So that's what's going to propel him. I mean last year he saw the third most targets per game uh close to nine as it was. So I think with the quarterback play he's a get from Joe Flacco. We mentioned reported he's already got those guys are like two piece in the pod like you mentioned. This is a player who's gotten better every single year of his career."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "11252",
                "sentiment_consensus": {
                    "negative": -2.945779252052307,
                    "neutral": -2.4009647727012635,
                    "positive": -1.541439700126648
                },
                "status": "perfect match",
                "transcript_name": "Joe Flacco"
            },
            "John Bates": {
                "average_label": "neutral",
                "detailed_sentiment": [
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -1.2999728918075562,
                            "neutral": -0.7828863263130188,
                            "positive": -4.171807289123535
                        },
                        "text": "really hasn't come together for Ben um yet and had a rough camper I heard rather yeah even even in camp hasn't been great so I think that's going to make them kind of rely on Z even more John Bates is a fine tight end he's just not going to be a factor in the pass catching realm and Z had a really good kick right and Z has looked great"
                    }
                ],
                "most_frequent_label": "neutral",
                "player_id": "4048228",
                "sentiment_consensus": {
                    "negative": -1.2999728918075562,
                    "neutral": -0.7828863263130188,
                    "positive": -4.171807289123535
                },
                "status": "perfect match",
                "transcript_name": "John Bates"
            },
            "Jordan Addison": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.996495485305786,
                            "neutral": -3.349252223968506,
                            "positive": -1.0609642267227173
                        },
                        "text": "And this is somebody when you look back at 2022 tight end two overall, 2023 tight end four overall. And I think he's extremely talented tight end who at one point had my dynasty tight end won overall because how much I loved him. I think that Jordan missing a couple games is enough to really propel him. Now that he's more than a full year removed from his injury, the fact that he's gonna be able to slide in as a number two target in this offense, um I think it'll kind of help propel him, build that rapport, JJ McCarthy, be again, we always talk about these rookie quarterbacks, like always one of their safety nets. It's usually the tight end."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4429205",
                "sentiment_consensus": {
                    "negative": -3.996495485305786,
                    "neutral": -3.349252223968506,
                    "positive": -1.0609642267227173
                },
                "status": "best of multiple matches",
                "transcript_name": "Jordan"
            },
            "Josh Downs": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.366141319274902,
                            "neutral": -3.312981367111206,
                            "positive": -2.337975025177002
                        },
                        "text": "Um coming off a year at Penn State where he had 104 catches uh for over,200 yards out there. All reports that I've seen so far coming out of Indianapolis is that this coaching staff has been working on getting Tyler Warren involved in offense early and often. So with those reports saying like we said, I like Josh Downs a ton. I like uh Michael Pitman as well. This is offense."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4688813",
                "sentiment_consensus": {
                    "negative": -4.366141319274902,
                    "neutral": -3.312981367111206,
                    "positive": -2.337975025177002
                },
                "status": "perfect match",
                "transcript_name": "Josh Downs"
            },
            "Josh Smith": {
                "average_label": "neutral",
                "detailed_sentiment": [
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.302690267562866,
                            "neutral": -2.8547558784484863,
                            "positive": -3.23695969581604
                        },
                        "text": "And you're right, man. It got real wonky to back here because there's so many guys I wanted to get in, right? I I found a path for John Smith with paired back up with Arthur Smith to be the clear number two option in Pittsburgh. I think there's a chance for him to be Ferguson. I'm spread knowing how to hit him."
                    }
                ],
                "most_frequent_label": "neutral",
                "player_id": "3915778",
                "sentiment_consensus": {
                    "negative": -3.302690267562866,
                    "neutral": -2.8547558784484863,
                    "positive": -3.23695969581604
                },
                "status": "best of multiple matches",
                "transcript_name": "John Smith"
            },
            "Justin Herbert": {
                "average_label": "negative",
                "detailed_sentiment": [
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -1.4268399477005005,
                            "neutral": -2.456003189086914,
                            "positive": -3.5509915351867676
                        },
                        "text": "And he has so much time like dude he could be a dud for two more years and be as year 27 still have three or four guys. We've been wanting a guy to go here forever. What if he's finally the guy that joins Justin Herbert? Oh dude. Yeah."
                    }
                ],
                "most_frequent_label": "negative",
                "player_id": "4038941",
                "sentiment_consensus": {
                    "negative": -1.4268399477005005,
                    "neutral": -2.456003189086914,
                    "positive": -3.5509915351867676
                },
                "status": "perfect match",
                "transcript_name": "Justin Herbert"
            },
            "Kenny Pickett": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.6712913513183594,
                            "neutral": -2.7794055938720703,
                            "positive": -2.2211718559265137
                        },
                        "text": "And I I like David Njoku. Obviously, we're all gushing about him right now. Do you guys have any concern that hey, they got rid of Kenny Kenny Picket? If something happens, they lose a few games, they're going to start turning to these rookies and then who the hell knows what we got out of a guy like David Njoku. No, I think Garrett, like even mentioned, like the way he's the fact he was able to produce even all the other turds back then."
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -3.4391767978668213,
                            "neutral": -4.124307155609131,
                            "positive": -4.656060695648193
                        },
                        "text": "So next year we have the most informed decision possible. Do we need to go out and make a move at quarterback? And I think that is I think especially with with the trading away of Kenny Picket that signals that that path even more to me. I I've said that for a while now. I think um I think this schedule starts so tough you can't throw a rookie quarterback in there."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4240703",
                "sentiment_consensus": {
                    "negative": -3.5552340745925903,
                    "neutral": -3.4518563747406006,
                    "positive": -3.4386162757873535
                },
                "status": "perfect match",
                "transcript_name": "Kenny Kenny Picket"
            },
            "Keon Coleman": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.371617317199707,
                            "neutral": -2.7279350757598877,
                            "positive": -1.5930203199386597
                        },
                        "text": "yes it's because they paid clear Shakir they didn't even pay him wide receiver one number they paid him wide receiver two to money and that's what Cleo Shakare really wins. So like does Keon Coleman step up in as the number one weapon in this offense or is it Dalton Kincaid? I'm gonna put my money on Dalton Kincaid in that manner and because if it is Khalil Shakir then we're just looking at lackluster passing game as it is as they spread around. I think for me even though he's tight end 26 last year um I think he has a chance to slide into that number one target role."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4635008",
                "sentiment_consensus": {
                    "negative": -4.371617317199707,
                    "neutral": -2.7279350757598877,
                    "positive": -1.5930203199386597
                },
                "status": "perfect match",
                "transcript_name": "Keon Coleman"
            },
            "Khalil Shakir": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.0499563217163086,
                            "neutral": -2.669801712036133,
                            "positive": -3.0380587577819824
                        },
                        "text": "and that's what Cleo Shakare really wins. So like does Keon Coleman step up in as the number one weapon in this offense or is it Dalton Kincaid? I'm gonna put my money on Dalton Kincaid in that manner and because if it is Khalil Shakir then we're just looking at lackluster passing game as it is as they spread around. I think for me even though he's tight end 26 last year um I think he has a chance to slide into that number one target role. So yes, am I being biased here?"
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.5274548530578613,
                            "neutral": -3.3939104080200195,
                            "positive": -2.1740827560424805
                        },
                        "text": "This is going to be his make or break year. This is by all reports even out of like outside of the scout I talked to saying hey they want to make sure this offense is run through like don't look conc just comes down to can he stay healthy can he get separation for me and for me I think coming in this offense that's going to be you know a dominant offense out there they have no clear cut wide receiver one on this offense yes it's because they paid clear Shakir they didn't even pay him wide receiver one number they paid him wide receiver two to money and that's what Cleo Shakare really wins. So like does Keon Coleman step up in as the number one weapon in this offense or is it Dalton Kincaid?"
                    }
                ],
                "most_frequent_label": "neutral",
                "player_id": "4373678",
                "sentiment_consensus": {
                    "negative": -3.288705587387085,
                    "neutral": -3.031856060028076,
                    "positive": -2.6060707569122314
                },
                "status": "best of multiple matches",
                "transcript_name": "Shakir"
            },
            "Kyle Pitts Sr.": {
                "average_label": "negative",
                "detailed_sentiment": [
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -1.5972598791122437,
                            "neutral": -2.1734490394592285,
                            "positive": -3.5069003105163574
                        },
                        "text": "Okay. There's so many all the like when we talk about all those bunch of guys in the bottom there like a guy in Zachary, it's Hunter Henry. I feel more comfortable about all them than Kyle Pitts. Like I just I'm I'm done until I see it and I don't believe it."
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -1.7370786666870117,
                            "neutral": -2.034947395324707,
                            "positive": -2.487724781036377
                        },
                        "text": "Oh, really? If they did, that's crazy because he was a top 10 pick, so they had to pay him top 10 pick fifth year option money, which is crazy on production. Yeah, I mean obviously he's besides his rookie year hasn't done anything that would indicate that you want the Atlanta Falcons picked up Kyle Pitt's fifth year contract option on April 29th. There's almost a 0% chance. Rich, there's a 0% chance already did it."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -5.070162296295166,
                            "neutral": -4.230280876159668,
                            "positive": -5.020834922790527
                        },
                        "text": "At 10 I have Mark Andrews. At 11 I have Hunter Henry. And at 12 I have Kyle Pitts. I thought about getting Hunter Henry in there. I you know it's a weird it's a weird range down there"
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -2.320829391479492,
                            "neutral": -2.906477928161621,
                            "positive": -2.945556640625
                        },
                        "text": "So he's my outlier. I think everything else like we all had Mark Andrews in there. I think the only one that I didn't hear you guys say that I did have was Kyle Pitts. Did you Nobody had Kyle Pitts in there? I did not have."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.5873167514801025,
                            "neutral": -2.347933530807495,
                            "positive": -3.4830358028411865
                        },
                        "text": "I think everything else like we all had Mark Andrews in there. I think the only one that I didn't hear you guys say that I did have was Kyle Pitts. Did you Nobody had Kyle Pitts in there? I did not have. So"
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -1.6099793910980225,
                            "neutral": -2.1932244300842285,
                            "positive": -3.4140257835388184
                        },
                        "text": "So yeah. So this is maybe not quite the same love, but Kyle Pitts is a player that Yes. He's been severely severely disappointing uh over over the course of the past three seasons, but we have a we have a new new sheriff in town."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -1.9678950309753418,
                            "neutral": -2.5270986557006836,
                            "positive": -1.6557368040084839
                        },
                        "text": "Yeah. compared to ADP. And it's the thing what Kyle Pitts cost you compared to what you give Hunter Henry for. It's like or Zach Ertz, you know what I mean? It's like Exactly."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.8279240131378174,
                            "neutral": -2.3655197620391846,
                            "positive": -2.3552637100219727
                        },
                        "text": "He's been severely severely disappointing uh over over the course of the past three seasons, but we have a we have a new new sheriff in town. We got a new quarterback in here. Um granted, it's what they should say, but all signs point to them saying like, \"No, we must get Kyle Pitts the football.\" Like, this is this is a must. He's the number two option in this offense."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.0827503204345703,
                            "neutral": -1.4538646936416626,
                            "positive": -3.3381383419036865
                        },
                        "text": "It's like Exactly. And once you're in that range, like what am I paying? And like if you still have Kyle Pitts, you're not definitely you'd rather just hope and hold on and go down with the ship, right? Like I might take a second, honestly. I don't think I would."
                    }
                ],
                "most_frequent_label": "negative",
                "player_id": "4360248",
                "sentiment_consensus": {
                    "negative": -2.4223550822999744,
                    "neutral": -2.4703107012642755,
                    "positive": -3.1341352330313788
                },
                "status": "perfect match",
                "transcript_name": "Kyle Pitts"
            },
            "Kyle Williams": {
                "average_label": "neutral",
                "detailed_sentiment": [
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -4.280580520629883,
                            "neutral": -1.239735722541809,
                            "positive": -2.1436409950256348
                        },
                        "text": "If he's going to be getting that kind of volume in this offense, which it could maybe trickle down a little bit. Uh we do have Stefon Diggs there. We we do have Kyle Williams there now. So, it could drop a little bit, but I don't think it's going to drop significantly. I still think he's going to be inside the top eight or so at on targets."
                    }
                ],
                "most_frequent_label": "neutral",
                "player_id": "4613202",
                "sentiment_consensus": {
                    "negative": -4.280580520629883,
                    "neutral": -1.239735722541809,
                    "positive": -2.1436409950256348
                },
                "status": "perfect match",
                "transcript_name": "Kyle Williams"
            },
            "Kyler Murray": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.663270473480225,
                            "neutral": -4.0723137855529785,
                            "positive": -2.722527027130127
                        },
                        "text": "It's only you be the first or second target in their offense. Obviously, uh you have Brock Bowers is number one target. Trey Trey McBride, you can argue is number one target with Kyler Murray in that offense. George Kittle, if he's not number one, he's 1B, right? I think the same thing in David Njoku falls into the same line as if he's not 1A, he is 1B."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "3917315",
                "sentiment_consensus": {
                    "negative": -4.663270473480225,
                    "neutral": -4.0723137855529785,
                    "positive": -2.722527027130127
                },
                "status": "perfect match",
                "transcript_name": "Kyler Murray"
            },
            "Mark Andrews": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.7273154258728027,
                            "neutral": -2.9858951568603516,
                            "positive": -3.1386451721191406
                        },
                        "text": "Just remind a little recap on that. We're not going to talk about the six player but just kind of so six through 12 T.J. Hockenson then Sam Sam LePorta, Evan Engram, Tucker Tucker Kraft at nine. At 10 I have Mark Andrews. At 11 I have Hunter Henry. And at 12 I have Kyle Pitts."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.514232873916626,
                            "neutral": -1.7609070539474487,
                            "positive": -1.4457021951675415
                        },
                        "text": "Uh but right now I'm going to be a little uh bearish on him even though I love him. So he's my outlier. I think everything else like we all had Mark Andrews in there. I think the only one that I didn't hear you guys say that I did have was Kyle Pitts. Did you Nobody had Kyle Pitts in there?"
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -0.38398414850234985,
                            "neutral": -3.426835060119629,
                            "positive": -3.5546655654907227
                        },
                        "text": "All signs that like literally they were trying to extend him. They get hurt real bad. Despite all that and despite that, Mark Andrews fell off like real hard early in the game. I think the first Now, you remember he he did have that pre uh season car accident. So, he was hurt going to the season."
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -0.8011557459831238,
                            "neutral": -1.9889318943023682,
                            "positive": -2.015716552734375
                        },
                        "text": "And if you want to get a part of that, just head to our Dynasty Nerds homepage, go under the store tab, and you'll find roster rescue right there. Perfect opportunity to get your rosters in shape before the season or even in the middle of the season to make sure that you can win a championship. Mark Andrew's on our list. You know,  somebody who's taking a big dump down is it really had to do with likely news. Sure."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.5282135009765625,
                            "neutral": -2.01049542427063,
                            "positive": -2.2627904415130615
                        },
                        "text": "Uh Travis Kelce at 10. So, we just picked a different rookie tight end together. Mark Andrews at 11. And I have Dalton Kincaid at 12. Makes sense."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.1178624629974365,
                            "neutral": -2.627793788909912,
                            "positive": -1.3609989881515503
                        },
                        "text": "Yeah. So, wait, who' you say was 11? Uh Mark Andrews. Okay. So, obviously all our outliers, Matt, Zach Ertz, go ahead."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.6059160232543945,
                            "neutral": -3.0602121353149414,
                            "positive": -2.2530746459960938
                        },
                        "text": "Now, now we see why George Kittle is below him in our in our GM tool. That might just be a function of We'll talk about that later. Um, Mark 10 10 Mark Andrews, 11 Zach Ertz. That's where I went a little crazy. Not a bad I had Zach Ertz written in."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.2167747020721436,
                            "neutral": -2.151405096054077,
                            "positive": -0.8800323605537415
                        },
                        "text": "So, he was hurt going to the season. Uh well, he didn't really start coming on until I think it was like week five or six. Mark Andrews finished as tight end six overall last year. Like, he was still a very solid. All the dude does is produce, man."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "3116365",
                "sentiment_consensus": {
                    "negative": -2.48693186044693,
                    "neutral": -2.5015594512224197,
                    "positive": -2.1139532402157784
                },
                "status": "perfect match",
                "transcript_name": "Mark Andrews"
            },
            "Mason Taylor": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.5116331577301025,
                            "neutral": -3.4373483657836914,
                            "positive": -1.2504760026931763
                        },
                        "text": "And like that's like like I felt good enough about it that I was like so I I didn't get any rookies in there, but do you want to know who I actually have projected as the highest rookie tight end? Mason Taylor. Mason Taylor. Mason Taylor."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.4440102577209473,
                            "neutral": -3.5401530265808105,
                            "positive": -1.6837714910507202
                        },
                        "text": "so I I didn't get any rookies in there, but do you want to know who I actually have projected as the highest rookie tight end? Mason Taylor. Mason Taylor. Mason Taylor. I mean, I can see that, too."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -1.955096960067749,
                            "neutral": -1.1384038925170898,
                            "positive": -1.03437077999115
                        },
                        "text": "Mason Taylor. Mason Taylor. Mason Taylor. I mean, I can see that, too. Yeah, no doubt."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4808766",
                "sentiment_consensus": {
                    "negative": -2.9702467918395996,
                    "neutral": -2.7053017616271973,
                    "positive": -1.3228727579116821
                },
                "status": "perfect match",
                "transcript_name": "Mason Taylor"
            },
            "Michael Pittman Jr.": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -5.3563079833984375,
                            "neutral": -2.7317707538604736,
                            "positive": -2.6868796348571777
                        },
                        "text": "All reports that I've seen so far coming out of Indianapolis is that this coaching staff has been working on getting Tyler Warren involved in offense early and often. So with those reports saying like we said, I like Josh Downs a ton. I like uh Michael Pitman as well. This is offense. I think they're going to want to keep the ball everything short and sweet."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4035687",
                "sentiment_consensus": {
                    "negative": -5.3563079833984375,
                    "neutral": -2.7317707538604736,
                    "positive": -2.6868796348571777
                },
                "status": "perfect match",
                "transcript_name": "Michael Pitman"
            },
            "RJ Harvey": {
                "average_label": "neutral",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.1082563400268555,
                            "neutral": -2.013091802597046,
                            "positive": -2.0034937858581543
                        },
                        "text": "I have I'm at four. And obviously, it's on the back of, you know, all the talk this whole offseason about Tron Peyton wanting to get a Evan Engram and then him going out and kind of finding his guy, going out and saying, \"Hey, this is this is the guy that I want.\" Him and R.J. Harvey, which I think R.J. Harvey is going to have a role this year. I don't know that it's going to be as the Evan Engram yet. You know, I think that's kind of one of those things that he'll have to grow into if he if he does become the long term."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.5547924041748047,
                            "neutral": -2.3692784309387207,
                            "positive": -5.297266960144043
                        },
                        "text": "I don't know that it's going to be as the Evan Engram yet. You know, I think that's kind of one of those things that he'll have to grow into if he if he does become the long term. And RJ Harvey's not even going to play on third downs. Like, you know, it's Yeah, it sounds like his pass blocking is a big concern at this point. So, he'll really need to grow in order to become that kind of guy."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.786975860595703,
                            "neutral": -2.5877156257629395,
                            "positive": -3.3515055179595947
                        },
                        "text": "And just imagine if you got you sold David Sam LePorta for David and David Njoku in like 111 and now you can sit there either with Sam LePorta and like Caleb Johnson. Sam Sam or I'm sorry um David and David Njoku. Yeah, David and David Njoku and Caleb Johnson, RJ Harvey, Colston Love, another tight end, a Jackson Dart. like and I feel much more comfortable with that combination because I'm with you Matt like as it's going to take another receiver to leave that for him to get into that situation"
                    }
                ],
                "most_frequent_label": "neutral",
                "player_id": "4568490",
                "sentiment_consensus": {
                    "negative": -3.4833415349324546,
                    "neutral": -2.323361953099569,
                    "positive": -3.550755421320597
                },
                "status": "perfect match",
                "transcript_name": "R.J. Harvey"
            },
            "Sam Acho": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.411167860031128,
                            "neutral": -3.1604363918304443,
                            "positive": -3.0509681701660156
                        },
                        "text": "Because you could probably get David and David Njoku plus a first uh this year.\" And just imagine if you got you sold David Sam LePorta for David and David Njoku in like 111 and now you can sit there either with Sam LePorta and like Caleb Johnson. Sam Sam or I'm sorry um David and David Njoku. Yeah, David and David Njoku and Caleb Johnson, RJ Harvey, Colston Love, another tight end, a Jackson Dart. like and I feel much more comfortable with that combination because I'm with you Matt"
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "14152",
                "sentiment_consensus": {
                    "negative": -3.411167860031128,
                    "neutral": -3.1604363918304443,
                    "positive": -3.0509681701660156
                },
                "status": "best of multiple matches",
                "transcript_name": "Sam Sam"
            },
            "Sam LaPorta": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.5931131839752197,
                            "neutral": -3.1729345321655273,
                            "positive": 0.3520788550376892
                        },
                        "text": "So he lost two targets per game because Jameson Williams took a big step up. What did we used to talk about with George Kittle? It was like well George Kittle can always he can perform if these other if one of these If one of these two other guys goes down, and it's a very similar thing argument you can make for Sam LePorta. If he if one of those guys goes down and Sam LePorta all of a sudden gets more of the target share because those naturally they're just out of the offense, then yeah, he can bump way the heck up. He's got the talent to do it."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.9193930625915527,
                            "neutral": -3.717428684234619,
                            "positive": 2.7226898670196533
                        },
                        "text": "What did we used to talk about with George Kittle? It was like well George Kittle can always he can perform if these other if one of these If one of these two other guys goes down, and it's a very similar thing argument you can make for Sam LePorta. If he if one of those guys goes down and Sam LePorta all of a sudden gets more of the target share because those naturally they're just out of the offense, then yeah, he can bump way the heck up. He's got the talent to do it. It's just there's only one football and there's only so many targets to go around per year."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.652259588241577,
                            "neutral": -3.023914337158203,
                            "positive": -2.5027709007263184
                        },
                        "text": "We've been talking about him a lot, so it doesn't surprise me. Yeah. So, like if I miss out on George Kittle to end round three, I have a very clear-cut draw who a guy who won't even go as tight end four because Sam LePorta is going to usually go tight end four there. T.J. Hockenson, but like I have a guy that is I am zeroed in on that I think will finish um in that tier. And I' I've said on our uh nerd herd show like has a chance if there's one tight end that could break the mold of these three guys."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.0317893028259277,
                            "neutral": -2.279682159423828,
                            "positive": -3.2014541625976562
                        },
                        "text": "So like my suggestion was like, \"Hey, move off of Sam LePorta for like even like a guy like in David Njoku extender plus, right? Because you could probably get David and David Njoku plus a first uh this year.\" And just imagine if you got you sold David Sam LePorta for David and David Njoku in like 111 and now you can sit there either with Sam LePorta and like Caleb Johnson. Sam Sam or I'm sorry um David and David Njoku. Yeah, David and David Njoku and Caleb Johnson, RJ Harvey, Colston Love, another tight end, a Jackson Dart."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.1019887924194336,
                            "neutral": -2.934950113296509,
                            "positive": -2.3642351627349854
                        },
                        "text": "I think, uh, you know, obviously this is a very crowded situation. Um, so that's going to be I think the biggest hurdle is to to get over is is to get the targets, but we've seen obviously rookies make a big impact in Ben Johnson's offense in the past. Sam Sam LePorta comes directly to mind his rookie year when he finished as I think tight end two or three. Um I can't remember it was he was tight end one at one point and I think I think he got passed in that year."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.5401110649108887,
                            "neutral": -1.7154266834259033,
                            "positive": -1.6835929155349731
                        },
                        "text": "like as it's going to take another receiver to leave that for him to get into that situation and yes they picked up Jameson Williams fifthear option but with how good Isaac Tessa has looked in this offense they spent a third round pick on him there's nothing to believe that if for some reason Jameson Williams leaves that Tesla is not going to literally slide into that Jameson Williams role so those concerns for me is again it's just about value verse production and I love Sam Sam LePorta I really do I think He's an amazing talent. It just comes down to the situation."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.000074625015259,
                            "neutral": -1.8698158264160156,
                            "positive": -1.1275501251220703
                        },
                        "text": "It's not on the amount of catches and yards he gets. I think it's the touchdowns is what I think he's I think you see double digit touchdowns this year. So, my six on is I have T.J. Hockenson at six, Sam Sam LePorta at seven, Tucker Tucker Kraft at eight, Tyler Warren at nine. Okay. Uh Travis Kelce at 10."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.953341245651245,
                            "neutral": -3.6518266201019287,
                            "positive": -3.0886895656585693
                        },
                        "text": "It's a that it all comes down to system and why we love again Alvin Kamaro so much because of the system he plays and how he plays. It's not as do the players. So, is there a path for Sam LePorta to join those elite guys again? Definitely as like some of these other guys start to age out. 100%."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.2328591346740723,
                            "neutral": -0.9418829083442688,
                            "positive": -2.580341339111328
                        },
                        "text": "Definitely as like some of these other guys start to age out. 100%. But as things stand now, Sam LePorta to me fits right where he finished last year. tight end seven, tight end eight. Like I'd almost rather chase the upside of a guy like Tucker Tucker Kraft plus"
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.530851125717163,
                            "neutral": -3.8287956714630127,
                            "positive": -1.941279411315918
                        },
                        "text": "tight end seven, tight end eight. Like I'd almost rather chase the upside of a guy like Tucker Tucker Kraft plus and I get a significant plus than having Sam Sam LePorta. Now, can I settle with Sam LePorta in Dynasty? Oh, I'm very happy to have him because if I have Titan 7, Titan 8, Tight end six, year in year out, like I feel very comfortable, but again, I'm trying to build the best roster possible to score the highest points, not settle, right?"
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.4753665924072266,
                            "neutral": -3.620108127593994,
                            "positive": -1.6865267753601074
                        },
                        "text": "Like I'd almost rather chase the upside of a guy like Tucker Tucker Kraft plus and I get a significant plus than having Sam Sam LePorta. Now, can I settle with Sam LePorta in Dynasty? Oh, I'm very happy to have him because if I have Titan 7, Titan 8, Tight end six, year in year out, like I feel very comfortable, but again, I'm trying to build the best roster possible to score the highest points, not settle, right? No, it makes perfect sense."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.109473705291748,
                            "neutral": 0.4016921818256378,
                            "positive": -0.5222312211990356
                        },
                        "text": "so my it goes to me it goes T.J. Hockenson Sam LePorta and Tucker Tucker Kraft for me and I could easily see all three of those guys being tight end six tight end seven and honestly they finish as like tight end five you know like T.J. Hockenson's talented enough like he could finish as tight end four and it wouldn't he could outproduce David Njoku I'm with you. I have him in my own tier, but like if he finishes tight end five, um if Sam LePorta was tight end five, if Tucker Tucker Kraft was tight end five, that does not shock me. So even though I have T.J. Hockenson at six, I'm with you in the tier group. Five through like eight to me are pretty close."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.459158182144165,
                            "neutral": -2.8042025566101074,
                            "positive": -3.0428528785705566
                        },
                        "text": "Do you want six through 12? Just remind a little recap on that. We're not going to talk about the six player but just kind of so six through 12 T.J. Hockenson then Sam Sam LePorta, Evan Engram, Tucker Tucker Kraft at nine. At 10 I have Mark Andrews. At 11 I have Hunter Henry."
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -1.7648764848709106,
                            "neutral": -2.1359939575195312,
                            "positive": -2.4544856548309326
                        },
                        "text": "so I I I see him in a very positive light. Uh and then for me, I have at seven, I have Sam LePorta. Yep. And then which is So do I. pretty low actually for well for ADP I'm saying uh overall ADP he's the fourth tight end off the board and when you look at Sam LePorta he's the 51st guy off the board then when you get into a lot of the guys that we're talking about Evan Engram David and David Njoku Tucker Tucker Kraft Evan Engram's 80 and David Njoku is"
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -2.1065001487731934,
                            "neutral": -2.5453996658325195,
                            "positive": -3.1270267963409424
                        },
                        "text": "Uh and then for me, I have at seven, I have Sam LePorta. Yep. And then which is So do I. pretty low actually for well for ADP I'm saying uh overall ADP he's the fourth tight end off the board and when you look at Sam LePorta he's the 51st guy off the board then when you get into a lot of the guys that we're talking about Evan Engram David and David Njoku Tucker Tucker Kraft Evan Engram's 80 and David Njoku is 82 Tucker Tucker Kraft's 108 um so"
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -5.038433074951172,
                            "neutral": -2.8304338455200195,
                            "positive": -1.4452775716781616
                        },
                        "text": "82 Tucker Tucker Kraft's 108 um so I mean he's significantly ahead of those guys so for me Sam Sam LePorta This is not a knock on him as a player. I think he's a very, very talented player."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.589828014373779,
                            "neutral": -4.856830596923828,
                            "positive": -2.979544162750244
                        },
                        "text": "Tighten eight. So, I mean, I came on a show six months ago and I brought this up and I said, \"Man, one of my biggest sells right now and tight end premium or in fantasy right now is Sam LePorta.\" We talked about that a lot on roster rescue as well. And I said, this has nothing to do with Sam LePorta."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.2472944259643555,
                            "neutral": -4.117393493652344,
                            "positive": 0.12160385400056839
                        },
                        "text": "and I said, \"Man, one of my biggest sells right now and tight end premium or in fantasy right now is Sam LePorta.\" We talked about that a lot on roster rescue as well. And I said, this has nothing to do with Sam LePorta. I think he's a super talented tight end. I was like, my point is he finishes tight end eight this year."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.927415132522583,
                            "neutral": -2.0841243267059326,
                            "positive": -1.17525315284729
                        },
                        "text": "I think he's a super talented tight end. I was like, my point is he finishes tight end eight this year. I feel going forward Sam LePorta, which is again a very solid asset to own, is gonna live in tight end six to eight range consistently. Um, and the reason why is I still have some my notes back here from early like six months ago and it says what happened to his targets per game. It went from seven to five."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4430027",
                "sentiment_consensus": {
                    "negative": -3.435480362490604,
                    "neutral": -2.722602732871708,
                    "positive": -1.669828380016904
                },
                "status": "perfect match",
                "transcript_name": "Sam LePorta"
            },
            "Sean Chandler": {
                "average_label": "neutral",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.17104434967041,
                            "neutral": -2.620556116104126,
                            "positive": -2.2393507957458496
                        },
                        "text": "I got tingles. That was like a Jeopardy thing. He reads it wrong to Sean. Sean Connor analyst. Can I have the butt experts, please?"
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.5194427967071533,
                            "neutral": -2.70500111579895,
                            "positive": -3.4767494201660156
                        },
                        "text": "Sean Connor analyst. Can I have the butt experts, please? Uh, that's analyst Sean. Ah, shut up, Tbec. So, we're back next week with those."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "3138733",
                "sentiment_consensus": {
                    "negative": -3.3452435731887817,
                    "neutral": -2.662778615951538,
                    "positive": -2.8580501079559326
                },
                "status": "best of multiple matches",
                "transcript_name": "Sean"
            },
            "Shedeur Sanders": {
                "average_label": "neutral",
                "detailed_sentiment": [
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -4.450994491577148,
                            "neutral": -1.956316351890564,
                            "positive": -2.412034511566162
                        },
                        "text": "I think they're going to want to see what they have in Dillon Gabriel because like if they they spend a third round pick on him. I I've been kind of hammering this all along, right? Like everybody's been I've been saying on the show like during rookie stuff like people are drafting Shadur Sanders way ahead of Dillon Gabriel but like the Browns love Dillon Gabriel and they've done that throughout camp they've done it through um this point they just named today Dillon Gabriel the number two quarterback. I mean I said it when they drafted him that dude can run the offense right now and he looks like he can run the offense right now. He looks good."
                    }
                ],
                "most_frequent_label": "neutral",
                "player_id": "4432762",
                "sentiment_consensus": {
                    "negative": -4.450994491577148,
                    "neutral": -1.956316351890564,
                    "positive": -2.412034511566162
                },
                "status": "perfect match",
                "transcript_name": "Shadur Sanders"
            },
            "Solomon Ajayi": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.205430507659912,
                            "neutral": -1.9901200532913208,
                            "positive": -1.579927682876587
                        },
                        "text": "Or replaces Travis Kelce. You know what I mean? Solomon knows. I thought that's what you were going to say. We've been trying to play for years forever."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4246885",
                "sentiment_consensus": {
                    "negative": -3.205430507659912,
                    "neutral": -1.9901200532913208,
                    "positive": -1.579927682876587
                },
                "status": "best of multiple matches",
                "transcript_name": "Solomon"
            },
            "Stefon Diggs": {
                "average_label": "neutral",
                "detailed_sentiment": [
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -4.347797393798828,
                            "neutral": -1.4895521402359009,
                            "positive": -2.2677807807922363
                        },
                        "text": "He was fifth last year, fifth in targets. If he's going to be getting that kind of volume in this offense, which it could maybe trickle down a little bit. Uh we do have Stefon Diggs there. We we do have Kyle Williams there now. So, it could drop a little bit, but I don't think it's going to drop significantly."
                    }
                ],
                "most_frequent_label": "neutral",
                "player_id": "2976212",
                "sentiment_consensus": {
                    "negative": -4.347797393798828,
                    "neutral": -1.4895521402359009,
                    "positive": -2.2677807807922363
                },
                "status": "perfect match",
                "transcript_name": "Stefon Diggs"
            },
            "T.J. Hockenson": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.6826369762420654,
                            "neutral": -1.3429890871047974,
                            "positive": -1.2106736898422241
                        },
                        "text": "Yeah. So, like if I miss out on George Kittle to end round three, I have a very clear-cut draw who a guy who won't even go as tight end four because Sam LePorta is going to usually go tight end four there. T.J. Hockenson, but like I have a guy that is I am zeroed in on that I think will finish um in that tier. And I' I've said on our uh nerd herd show like has a chance if there's one tight end that could break the mold of these three guys. This is the guy who I believe it is and it's my tight end four, David and David Njoku."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.4488296508789062,
                            "neutral": -3.171292304992676,
                            "positive": -1.4583286046981812
                        },
                        "text": "It's why I w I thought about putting T.J. Hockenson higher. For some reason, in my head, I only had it down as two. So, that's crazy."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.533904552459717,
                            "neutral": -2.522780418395996,
                            "positive": -2.675137519836426
                        },
                        "text": "Do you want six through 12? Just remind a little recap on that. We're not going to talk about the six player but just kind of so six through 12 T.J. Hockenson then Sam Sam LePorta, Evan Engram, Tucker Tucker Kraft at nine. At 10 I have Mark Andrews. At 11 I have Hunter Henry."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.409515380859375,
                            "neutral": -1.4077965021133423,
                            "positive": -1.8412986993789673
                        },
                        "text": "Oh yeah, Evan Engram four Jou five and then Travis G. So who did you have? I have T.J. Hockenson at six. I have T.J. Hockenson at six as well. Okay."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.5072715282440186,
                            "neutral": -1.786842942237854,
                            "positive": -2.033742904663086
                        },
                        "text": "So who did you have? I have T.J. Hockenson at six. I have T.J. Hockenson at six as well. Okay. Where do you have T.J. Hockenson?"
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.745248317718506,
                            "neutral": -3.6257989406585693,
                            "positive": -2.0614218711853027
                        },
                        "text": "Yeah. So, I mean, we could see we could obviously see T.J. Hockenson being much higher than where I have him. And and I think, you know, it was just more of a factor of getting other guys in above him and kind of at the end going, I need to get um T.J. Hockenson into this top 12. Where does he fit? Um"
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.400043249130249,
                            "neutral": -1.8166289329528809,
                            "positive": -2.2830252647399902
                        },
                        "text": "I have T.J. Hockenson at six as well. Okay. Where do you have T.J. Hockenson? Um 12. Oh wow."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.7689170837402344,
                            "neutral": -3.5267815589904785,
                            "positive": -0.5941383242607117
                        },
                        "text": "Now that he's more than a full year removed from his injury, the fact that he's gonna be able to slide in as a number two target in this offense, um I think it'll kind of help propel him, build that rapport, JJ McCarthy, be again, we always talk about these rookie quarterbacks, like always one of their safety nets. It's usually the tight end. I think T.J. Hockenson kind of felt um find himself in that position. I think Kevin Okonnell could trust T.J. Hockenson enough to be JJ safety enough as well on top of having a guy like Justin Jefferson. So for me having tight end six and Garrett you as well I'm sure you feel the same way is he's just too talented for me um not to not to come up this high"
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.9117274284362793,
                            "neutral": -1.6090041399002075,
                            "positive": -0.3674135208129883
                        },
                        "text": "It's not on the amount of catches and yards he gets. I think it's the touchdowns is what I think he's I think you see double digit touchdowns this year. So, my six on is I have T.J. Hockenson at six, Sam Sam LePorta at seven, Tucker Tucker Kraft at eight, Tyler Warren at nine. Okay. Uh Travis Kelce at 10."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.4002456665039062,
                            "neutral": -1.7595664262771606,
                            "positive": -1.432096242904663
                        },
                        "text": "Um and I I just felt really good about my other guys. So that's why T.J. Hockenson ended up 12. I think it's Yeah, it's three games. It's three games."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.150796890258789,
                            "neutral": -1.8186595439910889,
                            "positive": -3.6119086742401123
                        },
                        "text": "I mean yeah. Um, no, I don't have a lot of con I don't have a lot of conviction about about T.J. Hockenson here at 12. Um, he was tight end 12 on the year last year. Only only played 10 games."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.759183406829834,
                            "neutral": -1.4867111444473267,
                            "positive": -2.074216365814209
                        },
                        "text": "And that's why I said like six through eight I feel more comfortable interchanging. But at the same time, those guys could easily jump up for me. So I do like you have T.J. Hockenson at six as well. I have T.J. Hockenson at six as well. And yeah, I echo a lot of the same things you do."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.1960763931274414,
                            "neutral": -1.4953316450119019,
                            "positive": -1.0449731349945068
                        },
                        "text": "But at the same time, those guys could easily jump up for me. So I do like you have T.J. Hockenson at six as well. I have T.J. Hockenson at six as well. And yeah, I echo a lot of the same things you do. It just comes down to the to the player himself."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4036133",
                "sentiment_consensus": {
                    "negative": -2.83956896341764,
                    "neutral": -2.1053987374672523,
                    "positive": -1.7452596013362591
                },
                "status": "perfect match",
                "transcript_name": "T.J. Hockenson"
            },
            "Taylor Bertolet": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -4.547961235046387,
                            "neutral": -3.167053699493408,
                            "positive": -3.773939609527588
                        },
                        "text": "He's going to be engaged. So he got engaged today, but I did I not say this podcast a month ago. My birdie had told me that Travis and Taylor would be getting engaged soon. Yeah, you did say that. Did I not say that?"
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.9884753227233887,
                            "neutral": -4.483779430389404,
                            "positive": -2.2411296367645264
                        },
                        "text": "but yeah you have we are the official Taylor Swift podcast obviously. Come on join my podcast. Taylor I to be honest with you everything I've heard about her is like first of all my wife wanted to watch that podcast when she was on New Heights. I thought she came out absolutely fantastic."
                    }
                ],
                "most_frequent_label": "neutral",
                "player_id": "2578718",
                "sentiment_consensus": {
                    "negative": -4.268218278884888,
                    "neutral": -3.8254165649414062,
                    "positive": -3.007534623146057
                },
                "status": "best of multiple matches",
                "transcript_name": "Taylor"
            },
            "Terry Beckner Jr.": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -5.304656028747559,
                            "neutral": -2.504762887954712,
                            "positive": -2.279961109161377
                        },
                        "text": "I just I I I think this is a great offense. Obviously, year two with um Jaden Daniels, I think the whole offense is going to be better and humming and obviously they they got uh Terry in which is I think great news just for this whole kind of thing going on and you know they're they're they brought in Z I think as a guy that they felt familiar with and they drafted Ben Sinnott last year. really hasn't come together for Ben um yet and had a rough camper I heard rather yeah"
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "3924310",
                "sentiment_consensus": {
                    "negative": -5.304656028747559,
                    "neutral": -2.504762887954712,
                    "positive": -2.279961109161377
                },
                "status": "best of multiple matches",
                "transcript_name": "Terry"
            },
            "Thomas Booker IV": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.244235515594482,
                            "neutral": -4.046827793121338,
                            "positive": -4.029067039489746
                        },
                        "text": "Yeah. So, he's still putting up borderline number one overall tight end numbers just with any random quarterback last year. Jameus Winston, uh, Thomas, uh, I even forget his name now. Thompson Robinson, Dorian Thompson Robinson, the worst quarterback I've ever seen play in. Yeah, terrible."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4360749",
                "sentiment_consensus": {
                    "negative": -4.244235515594482,
                    "neutral": -4.046827793121338,
                    "positive": -4.029067039489746
                },
                "status": "best of multiple matches",
                "transcript_name": "Thomas"
            },
            "Travis Bell": {
                "average_label": "neutral",
                "detailed_sentiment": [
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -4.493448257446289,
                            "neutral": -3.1977012157440186,
                            "positive": -3.8063669204711914
                        },
                        "text": "He's going to be engaged. So he got engaged today, but I did I not say this podcast a month ago. My birdie had told me that Travis and Taylor would be getting engaged soon. Yeah, you did say that. Did I not say that?"
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.55381441116333,
                            "neutral": -2.8569443225860596,
                            "positive": -3.2583680152893066
                        },
                        "text": "Because we have our Oh, yeah. So you have I think my Evan Engram was or no? Oh yeah, Evan Engram four Jou five and then Travis G. So who did you have? I have T.J. Hockenson at six."
                    }
                ],
                "most_frequent_label": "neutral",
                "player_id": "4246741",
                "sentiment_consensus": {
                    "negative": -4.02363133430481,
                    "neutral": -3.027322769165039,
                    "positive": -3.532367467880249
                },
                "status": "best of multiple matches",
                "transcript_name": "Travis"
            },
            "Travis Kelce": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.496610403060913,
                            "neutral": -2.659839153289795,
                            "positive": -1.786442518234253
                        },
                        "text": "Any another slight down tick from his production like we saw last year where everything was down, right? Um it just moves him from tight end five to tight end 10 because it's it's that close on a point per game basis. Where do you have tight end uh Travis Kelce Matt? Six. Oh, so pretty high."
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -1.4995335340499878,
                            "neutral": -1.7421674728393555,
                            "positive": -2.002375364303589
                        },
                        "text": "Yeah. There. Or replaces Travis Kelce. You know what I mean? Solomon knows."
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -1.8310786485671997,
                            "neutral": -2.1001431941986084,
                            "positive": -2.841090679168701
                        },
                        "text": "You can't you can't mess with that. Yeah. So, um you have Travis Kelce at five. I actually have not at 10. Okay."
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -1.213931918144226,
                            "neutral": -1.6431916952133179,
                            "positive": -1.3949121236801147
                        },
                        "text": "Where Rashee Rice wins like he's not like a take the top off defense like he wins in the middle of field, right? Like the short crossing routes are his bread and butter. So, I think he takes away from Travis Kelce is what it is. So, I still have a tight end 10. If you finished higher, not surprised because like you said, my tight end from tight end eight down."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.118762016296387,
                            "neutral": -2.074042797088623,
                            "positive": -1.246289849281311
                        },
                        "text": "oh he's tight end 12 again like it could easily be love at 12 but anyways who's your sixth through 12. All right 6 through 12 I went uh Travis Kelce Sam Sam LePorta at seven at eight I went Colston Loveland. Whoa. Yeah."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.5694663524627686,
                            "neutral": -2.1698102951049805,
                            "positive": -2.211413860321045
                        },
                        "text": "So, my six on is I have T.J. Hockenson at six, Sam Sam LePorta at seven, Tucker Tucker Kraft at eight, Tyler Warren at nine. Okay. Uh Travis Kelce at 10. So, we just picked a different rookie tight end together. Mark Andrews at 11."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.30576753616333,
                            "neutral": -2.1013941764831543,
                            "positive": -1.759663701057434
                        },
                        "text": "So, Garrett, who is your five? So, my five, I actually went back to Old Faithful. Uh, I put Travis Kelce there. Uh, I think the thoughts of his demise were overblown last year. He was tight end five last year."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.307790756225586,
                            "neutral": -4.013707637786865,
                            "positive": -1.5117722749710083
                        },
                        "text": "And and you know, given, you know, that some of these guys, you know, George Kittle's a little bit older. Evan Engram's a little bit older. Travis Kelce obviously a little bit older. He's a guy that we're going to be having to have the conversation, you know, is he this next guy that's going to be able to get a tier if if Green Bay's wide receivers kind of start to dissipate in the next couple of seasons or even just solidify who's who and well, what's what's the roles there? I I mentioned it when we were doing all the division breakdowns."
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": 2.07092022895813,
                            "neutral": -4.361506462097168,
                            "positive": -3.355829954147339
                        },
                        "text": "Right. So, for me, it's just I think the Rashee Rice effect is what's going to take away from Travis Kelce just enough because it is so close. Just kind of we talked about before the light tight ends or the receivers. It's just so close."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "15847",
                "sentiment_consensus": {
                    "negative": -2.25244677066803,
                    "neutral": -2.5406447649002075,
                    "positive": -2.0121989250183105
                },
                "status": "perfect match",
                "transcript_name": "Travis Kelce"
            },
            "Trey McBride": {
                "average_label": "neutral",
                "detailed_sentiment": [
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -1.22136390209198,
                            "neutral": -1.1124300956726074,
                            "positive": -2.238636016845703
                        },
                        "text": "Yeah, understandable. Sure. Trey Trey McBride 27. Uhhuh. 10 picks later, George Kittle 38."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.070112943649292,
                            "neutral": -2.628800868988037,
                            "positive": -2.336946487426758
                        },
                        "text": "That's the value. Every reddraft league I've done so far, every best ball draft I've done, I let everybody jump on Brock I wait for Brock Bowers to go. Trey McBride goes like real quick after and I make sure I get George Kittle because that is where the value is. instead of taking Brock Bowers and, you know, missing out on that elite other running back or top tier receiver, I'm like, dude, I'm just gonna get George Kittle. Let me ask you this, though."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.588094711303711,
                            "neutral": -1.8538011312484741,
                            "positive": -2.9704298973083496
                        },
                        "text": "True. Just mind you that. So Brock Bowers one, George Kittle two, Trey Trey McBride three. I just I went chalky chalk. I went Brock Bowers Trey Trey McBride Trey McBride then George Kittle same as last year's um finish."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.5276546478271484,
                            "neutral": -2.075267791748047,
                            "positive": -2.523914098739624
                        },
                        "text": "So Brock Bowers one, George Kittle two, Trey Trey McBride three. I just I went chalky chalk. I went Brock Bowers Trey Trey McBride Trey McBride then George Kittle same as last year's um finish. But I mean, you know, it's it is what it is. These guys, you can't go wrong with either one of these."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -5.602674961090088,
                            "neutral": -3.9330077171325684,
                            "positive": -2.452263593673706
                        },
                        "text": "It's only you be the first or second target in their offense. Obviously, uh you have Brock Bowers is number one target. Trey Trey McBride, you can argue is number one target with Kyler Murray in that offense. George Kittle, if he's not number one, he's 1B, right? I think the same thing in David Njoku falls into the same line as if he's not 1A, he is 1B."
                    }
                ],
                "most_frequent_label": "neutral",
                "player_id": "4361307",
                "sentiment_consensus": {
                    "negative": -3.201980233192444,
                    "neutral": -2.320661520957947,
                    "positive": -2.504438018798828
                },
                "status": "perfect match",
                "transcript_name": "Trey McBride"
            },
            "Tucker Kraft": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.5766634941101074,
                            "neutral": -3.1688427925109863,
                            "positive": -0.568516731262207
                        },
                        "text": "So, I I think I think there's going to be a conversation, you know, about Tucker Tucker Kraft. Is he is he talented enough to be a top four guy in a couple of seasons? So, this might be a nice opportunity while he's kind of had has a little bit of a depressed um value to kind of go out and say, \"Hey, let's let's make some moves for Tucker Kraft now because in two or three years, he's going to be a guy that's kind of up in this other echelon um nipping at at heels of the top tier.\" He is a great That's a really good point from a D perspective. He's probably one of the best high upside buys at the position."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.941469430923462,
                            "neutral": -1.9825806617736816,
                            "positive": -3.3505661487579346
                        },
                        "text": "He's probably one of the best high upside buys at the position. Yeah, absolutely. Yeah, and I don't I don't have much to add on Tucker Tucker Kraft. I echo what you guys say. I think he's a good player that's in a little bit of a messy situation, but the talent overrides that for me, and so I'm willing any guy in this range is a risk, but he's a guy that I'm willing to take the risk on."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.7463440895080566,
                            "neutral": -3.091637134552002,
                            "positive": -3.365105152130127
                        },
                        "text": "Do you want six through 12? Just remind a little recap on that. We're not going to talk about the six player but just kind of so six through 12 T.J. Hockenson then Sam Sam LePorta, Evan Engram, Tucker Tucker Kraft at nine. At 10 I have Mark Andrews. At 11 I have Hunter Henry."
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -3.161748170852661,
                            "neutral": -3.4200663566589355,
                            "positive": -4.153388500213623
                        },
                        "text": "Yep. And then which is So do I. pretty low actually for well for ADP I'm saying uh overall ADP he's the fourth tight end off the board and when you look at Sam LePorta he's the 51st guy off the board then when you get into a lot of the guys that we're talking about Evan Engram David and David Njoku Tucker Tucker Kraft Evan Engram's 80 and David Njoku is 82 Tucker Tucker Kraft's 108 um so I mean he's significantly ahead of those guys so for me Sam Sam LePorta"
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.8326826095581055,
                            "neutral": -4.137280464172363,
                            "positive": -1.876037359237671
                        },
                        "text": "He said, you know, he said, \"If there's an area we got to do better at, it's featuring the tight end.\" And we saw last year that this offense targeted the tight ends 25% of the time. Um, when you have somebody who in her first year as being the main guy there excel uh with the ball in his hands like Tucker Tucker Kraft did, I see why he would say something like that with such a poperri of mystery at the receiver position. It's kind of playing out. I think in the end it could be somebody like Tucker Tucker Kraft is the most valuable receiving weapon we see in that offense."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -4.025345325469971,
                            "neutral": -1.680448055267334,
                            "positive": -1.7964427471160889
                        },
                        "text": "but it just hasn't and he's still he's still putting up numbers. All right let's talk two rookies then we'll finish it off with Tucker Tucker Kraft talk. Sounds good. Okay."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.0316057205200195,
                            "neutral": -4.193031311035156,
                            "positive": -1.5017977952957153
                        },
                        "text": "Um, when you have somebody who in her first year as being the main guy there excel uh with the ball in his hands like Tucker Tucker Kraft did, I see why he would say something like that with such a poperri of mystery at the receiver position. It's kind of playing out. I think in the end it could be somebody like Tucker Tucker Kraft is the most valuable receiving weapon we see in that offense. So, I think we're all like pretty comfortable because he finished the tight end eight last year. No reason not to do that."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.236706256866455,
                            "neutral": -2.1911070346832275,
                            "positive": -1.3571964502334595
                        },
                        "text": "It's not on the amount of catches and yards he gets. I think it's the touchdowns is what I think he's I think you see double digit touchdowns this year. So, my six on is I have T.J. Hockenson at six, Sam Sam LePorta at seven, Tucker Tucker Kraft at eight, Tyler Warren at nine. Okay. Uh Travis Kelce at 10."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.8777103424072266,
                            "neutral": -3.197734832763672,
                            "positive": 0.5424076914787292
                        },
                        "text": "Yep. But he's the kind of guy like I said, right? I ended at eight for Tucker Kraft for a reason because that was the last guy I saw that could propel up to like as high as five and it wouldn't shock me in the least. Yeah, he's super talented, man. And and you know, given, you know, that some of these guys, you know, George Kittle's a little bit older."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.357628345489502,
                            "neutral": -2.6851296424865723,
                            "positive": -1.5802115201950073
                        },
                        "text": "So for me having tight end six and Garrett you as well I'm sure you feel the same way is he's just too talented for me um not to not to come up this high but like I said when I get to tight end 678 so my it goes to me it goes T.J. Hockenson Sam LePorta and Tucker Tucker Kraft for me and I could easily see all three of those guys being tight end six tight end seven and honestly they finish as like tight end five you know like T.J. Hockenson's talented enough like he could finish as tight end four and it wouldn't he could outproduce David Njoku I'm with you. I have him in my own tier, but like if he finishes tight end five, um if Sam LePorta was tight end five, if Tucker Tucker Kraft was tight end five, that does not shock me."
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -2.0124497413635254,
                            "neutral": -2.10927677154541,
                            "positive": -2.162487030029297
                        },
                        "text": "I was like I told you you loved him. I love him. I was like, uh, number nine, Tucker Tucker Kraft. Now, now we see why George Kittle is below him in our in our GM tool. That might just be a function of We'll talk about that later."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.4372963905334473,
                            "neutral": -1.0157982110977173,
                            "positive": -0.9366025924682617
                        },
                        "text": "so my it goes to me it goes T.J. Hockenson Sam LePorta and Tucker Tucker Kraft for me and I could easily see all three of those guys being tight end six tight end seven and honestly they finish as like tight end five you know like T.J. Hockenson's talented enough like he could finish as tight end four and it wouldn't he could outproduce David Njoku I'm with you. I have him in my own tier, but like if he finishes tight end five, um if Sam LePorta was tight end five, if Tucker Tucker Kraft was tight end five, that does not shock me. So even though I have T.J. Hockenson at six, I'm with you in the tier group. Five through like eight to me are pretty close."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.63425612449646,
                            "neutral": -3.380241870880127,
                            "positive": -2.9567606449127197
                        },
                        "text": "Yep. I went I went 678. Uh before we give because I know we're gonna talk about Tucker Tucker Kraft. You went to six. I I"
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.3530020713806152,
                            "neutral": -3.991766929626465,
                            "positive": -1.2594146728515625
                        },
                        "text": "They have a lot of guys that are coming up on contract years. So, they it's not going to be the same thing in two years in Green Bay than it is right now. So, I I think I think there's going to be a conversation, you know, about Tucker Tucker Kraft. Is he is he talented enough to be a top four guy in a couple of seasons? So, this might be a nice opportunity while he's kind of had has a little bit of a depressed um value to kind of go out and say, \"Hey, let's let's make some moves for Tucker Kraft now because in two or three years, he's going to be a guy that's kind of up in this other echelon um nipping at at heels of the top tier.\""
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.516291379928589,
                            "neutral": -3.8797924518585205,
                            "positive": -1.5640761852264404
                        },
                        "text": "But as things stand now, Sam LePorta to me fits right where he finished last year. tight end seven, tight end eight. Like I'd almost rather chase the upside of a guy like Tucker Tucker Kraft plus and I get a significant plus than having Sam Sam LePorta. Now, can I settle with Sam LePorta in Dynasty?"
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.808767318725586,
                            "neutral": -1.9904431104660034,
                            "positive": -2.597177028656006
                        },
                        "text": "Yeah. A ton. And then um so it leaves us with Tucker Tucker Kraft. Uh I had him an eight. Matt, you had him at nine."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4572680",
                "sentiment_consensus": {
                    "negative": -3.346872925758362,
                    "neutral": -2.882198601961136,
                    "positive": -1.905210804194212
                },
                "status": "perfect match",
                "transcript_name": "Tucker Craft"
            },
            "Tyler Warren": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.53688907623291,
                            "neutral": -2.0446174144744873,
                            "positive": -1.2698711156845093
                        },
                        "text": "And once you have that kind of stuff established and the kind of chemistry established with the quarterback, hey, I know you're going to be here when when you're supposed to be and I can let it rip and you're going to make that catch and get me yards after the catch, which is something Coulson Lovelin is very good at. I think I think it's going to be kind of a glove inhand fit with with Coulson Lovelin, the young quarterback, and this offense. I kind of felt that way about Tyler Warren. We saw him, he's coming out of Penn State. We said when scouting him, he's probably the most pro ready tight end that we saw that probably had like I think we talked about like it wouldn't surprise us if Tyler Warren had the most productive year one, but if it wouldn't surprise us also if Coulson Leland had a better long-term career."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.509389400482178,
                            "neutral": -4.168685436248779,
                            "positive": -3.0071651935577393
                        },
                        "text": "I kind of felt that way about Tyler Warren. We saw him, he's coming out of Penn State. We said when scouting him, he's probably the most pro ready tight end that we saw that probably had like I think we talked about like it wouldn't surprise us if Tyler Warren had the most productive year one, but if it wouldn't surprise us also if Coulson Leland had a better long-term career. Um coming off a year at Penn State where he had 104 catches uh for over,200 yards out there. All reports that I've seen so far coming out of Indianapolis is that this coaching staff has been working on getting Tyler Warren involved in offense early and often."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.542162895202637,
                            "neutral": -4.056048393249512,
                            "positive": -2.8547661304473877
                        },
                        "text": "We said when scouting him, he's probably the most pro ready tight end that we saw that probably had like I think we talked about like it wouldn't surprise us if Tyler Warren had the most productive year one, but if it wouldn't surprise us also if Coulson Leland had a better long-term career. Um coming off a year at Penn State where he had 104 catches uh for over,200 yards out there. All reports that I've seen so far coming out of Indianapolis is that this coaching staff has been working on getting Tyler Warren involved in offense early and often. So with those reports saying like we said, I like Josh Downs a ton. I like uh Michael Pitman as well."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.7155847549438477,
                            "neutral": -3.281672477722168,
                            "positive": -0.03733624145388603
                        },
                        "text": "Help Daniel Jones out on his roll out who's the athletic tight end. And I think they're going to find ways to make sure that he's either the first or second look in this offense. So, for me, I think Tyler Warren, just because of target share alone, how many catches he's going to get this year, is going to finish as a tight end one. Uh, a lot of guys you could switch him out for, but I want to sneak one. I I"
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.323129415512085,
                            "neutral": -2.019498348236084,
                            "positive": -1.2847362756729126
                        },
                        "text": "Eight. Eight. And I have Tyler Warren at nine. So, um I was telling Garrett on the uh fantasy roster rescue show like God, why is this George Kittle thing off? And then he looked it up."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4431459",
                "sentiment_consensus": {
                    "negative": -3.7254311084747314,
                    "neutral": -3.114104413986206,
                    "positive": -1.690774991363287
                },
                "status": "perfect match",
                "transcript_name": "Tyler Warren"
            },
            "Wilson Huber": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.238513946533203,
                            "neutral": -1.94727623462677,
                            "positive": -1.4878507852554321
                        },
                        "text": "Yeah, no doubt. Nobody there to catch the football outside of Garrett Wilson. Wilson and him. Baron. Yes."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4239107",
                "sentiment_consensus": {
                    "negative": -3.238513946533203,
                    "neutral": -1.94727623462677,
                    "positive": -1.4878507852554321
                },
                "status": "best of multiple matches",
                "transcript_name": "Wilson"
            },
            "Zach Ertz": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.685516119003296,
                            "neutral": -2.699594497680664,
                            "positive": -1.823122501373291
                        },
                        "text": "Jake Ferguson has a chance like all those guys are all sitting there. Hunter Henry, I was like, dude, a very clear path for him to be the number two target there. Zach Ertz was another guy getting in there. I settle Dalton Kincaid. I think it's pretty clear and obvious this is a player, former first round pick, enters year three year."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.446071147918701,
                            "neutral": -1.9989687204360962,
                            "positive": -2.2522926330566406
                        },
                        "text": "compared to ADP. And it's the thing what Kyle Pitts cost you compared to what you give Hunter Henry for. It's like or Zach Ertz, you know what I mean? It's like Exactly. And once you're in that range, like what am I paying?"
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -1.7577670812606812,
                            "neutral": -3.8980727195739746,
                            "positive": 0.06859781593084335
                        },
                        "text": "Uh Mark Andrews. Okay. So, obviously all our outliers, Matt, Zach Ertz, go ahead. You want to talk about Zach Ertz real quick? I mean, I we we basically touched on it."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "15835",
                "sentiment_consensus": {
                    "negative": -2.9631181160608926,
                    "neutral": -2.865545312563578,
                    "positive": -1.3356057728330295
                },
                "status": "perfect match",
                "transcript_name": "Zach Ertz"
            },
            "Zachary Carter": {
                "average_label": "negative",
                "detailed_sentiment": [
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -1.7365813255310059,
                            "neutral": -2.107487678527832,
                            "positive": -2.3781776428222656
                        },
                        "text": "Uh, some former Rams guy. Okay. There's so many all the like when we talk about all those bunch of guys in the bottom there like a guy in Zachary, it's Hunter Henry. I feel more comfortable about all them than Kyle Pitts. Like I just I'm I'm done until I see it"
                    }
                ],
                "most_frequent_label": "negative",
                "player_id": "4240619",
                "sentiment_consensus": {
                    "negative": -1.7365813255310059,
                    "neutral": -2.107487678527832,
                    "positive": -2.3781776428222656
                },
                "status": "perfect match",
                "transcript_name": "Zachary"
            },
            "Zack Annexstad": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.9847636222839355,
                            "neutral": -3.351806640625,
                            "positive": -3.2302536964416504
                        },
                        "text": "And I had to take him out for my 11 guy because there's no way I was not going to put my 12th guy in. Um, I know who that is. But I had Zach Ertz written in. Okay. All right."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.096862316131592,
                            "neutral": -4.309828758239746,
                            "positive": -2.0178163051605225
                        },
                        "text": "Okay. So, obviously all our outliers, Matt, Zach Ertz, go ahead. You want to talk about Zach Ertz real quick? I mean, I we we basically touched on it. I just I I"
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.840954065322876,
                            "neutral": -2.055988073348999,
                            "positive": -1.7587889432907104
                        },
                        "text": "I still think the Debo I I still think I still think he gets enough. I think I think where Zach Ertz gets there is. It's not on the amount of catches and yards he gets. I think it's the touchdowns is what I think he's I think you see double digit touchdowns this year."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.414069652557373,
                            "neutral": -4.71750545501709,
                            "positive": -3.3753631114959717
                        },
                        "text": "Um, Mark 10 10 Mark Andrews, 11 Zach Ertz. That's where I went a little crazy. Not a bad I had Zach Ertz written in. Yeah. And I had to take him out for my 11 guy because there's no way I was not going to put my 12th guy in."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4360936",
                "sentiment_consensus": {
                    "negative": -3.084162414073944,
                    "neutral": -3.6087822318077087,
                    "positive": -2.5955555140972137
                },
                "status": "best of multiple matches",
                "transcript_name": "Zack"
            }
        }
        // const sortedPlayers = sortPlayersByMentions(results)
        const sortedPlayers = sortPlayersByStatusAndMentions(results);
        console.dir(results[sortedPlayers[0]]);

        setSortedPlayers(sortedPlayers)
        setAnalysisResult(results)
        setLoading(false);
    }

    async function callAPI() {
        try {
            setLoading(true);
            console.log("calling api")
            // const response = await getNFLPlayers();
            // const response = await getPlayerObjectForAnalysis(submittedText);
            const response = await performAnalysis(submittedText);
            console.log("response: ", response);

            const sortedPlayers = sortPlayersByStatusAndMentions(response)
            console.log("sorted Players: ", sortedPlayers);

            setAnalysisResult(response);
            setSortedPlayers(sortedPlayers);
            setLoading(false);
        } catch (error) {
            console.error("Error calling API: ", error);
            setLoading(false);
        }
    }

    async function callAPIStream(cancellationToken: { cancelled: boolean }) {
        try {
            setLoading(true);
            setProgress(0);
            setLoadingMessage("Starting analysis...");

            console.log("calling api stream")
            await performAnalysisStream(
                submittedText,
                (progress, message) => {
                    if (cancellationToken.cancelled) return;

                    setProgress(progress);
                    setLoadingMessage(message);
                },
                (result) => {
                    if (cancellationToken.cancelled) return;

                    console.log("streaming complete, moving to sorting");
                    const sortedPlayers = sortPlayersByStatusAndMentions(result)
                    console.log("sorted Players: ", sortedPlayers);

                    setAnalysisResult(result);
                    setSortedPlayers(sortedPlayers);
                    setLoading(false);
                }
            );
        } catch (error) {
            console.error("Error calling API: ", error);
            setLoading(false);
        }
    }

    return (
        <>
            <div className="flex flex-col items-center">
                {
                    !loading ?
                        <>
                            <div className="flex items-center space-x-2">
                                <Label htmlFor="show-sidebar">
                                    {
                                        showSidebar ? "View Player Occurrences in Sidebar" : "View Player Occurrences as Carousel"
                                    }
                                </Label>
                                <Switch
                                    id="show-sidebar"
                                    checked={showSidebar}
                                    onClick={onSwitchClick}
                                />
                            </div>

                            <div className="w-full flex flex-row items-start justify-between">
                                <div className={`transition-all duration-300 ${openDrawerPlayer ? "w-[70vw]" : "w-[80vw] mx-auto"} flex flex-col gap-10 p-4`}>
                                    {sortedPlayers.map((player, index) => (
                                        <PlayerCard
                                            key={index}
                                            player={player}
                                            analysisResult={analysisResult}
                                            showSidebar={showSidebar}
                                            onOpenDrawer={() => setOpenDrawerPlayer(player)}
                                        />
                                    ))}
                                </div>

                                {openDrawerPlayer && (
                                    <div className="w-[25vw] sticky right-0 top-0 h-screen overflow-y-auto border-l bg-background shadow-xl flex flex-col transition-all duration-300 z-50">
                                        <div className="flex items-center justify-between px-4 py-3 border-b">
                                            <h3 className="font-semibold text-sm">{openDrawerPlayer} — Occurrences</h3>
                                            <button onClick={() => setOpenDrawerPlayer(null)} className="text-muted-foreground hover:text-foreground">✕</button>
                                        </div>
                                        <div className="overflow-y-auto flex-1 p-4 flex flex-col gap-4">
                                            {analysisResult[openDrawerPlayer].detailed_sentiment.map((occurrence, index) => {
                                                const colors = labelColorMap[occurrence.best_label] ?? { text: "#60646b", bg: "#f3f4f6" };
                                                return (
                                                    <Card key={index}>
                                                        <CardHeader className="flex flex-row items-center justify-between py-2 px-4 border-b">
                                                            <span className="text-xs text-muted-foreground">Mention {index + 1}</span>
                                                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
                                                                style={{ color: colors.text, backgroundColor: colors.bg }}>
                                                                {occurrence.best_label}
                                                            </span>
                                                        </CardHeader>
                                                        <CardContent className="px-4 py-3">
                                                            <p className="text-sm leading-relaxed">
                                                                <HighlightWord text={occurrence.text} wordToBold={openDrawerPlayer} />
                                                            </p>
                                                        </CardContent>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                        : <>
                            <div className="w-full max-w-sm flex h-[80vh] flex-col justify-center">
                                <div className="w-full max-w-sm flex flex-col py-4">
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="h-5 overflow-hidden relative" style={{ perspective: '300px' }}>
                                            <span
                                                key={loadingMessage}
                                                className="text-xs text-muted-foreground block animate-message-in"
                                            >
                                                {loadingMessage ? loadingMessage : "No loading message"}
                                            </span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">{progress}%</span>
                                    </div>
                                    <Progress value={progress} />
                                </div>
                            </div>
                        </>
                }
            </div>
        </>
    )
}